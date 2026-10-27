use std::path::{Path, PathBuf};

use crate::domains::file_transfer::application::ports::{
    ConflictResolverPort, TransferFileSystemPort, TransferProgressPort,
};
use crate::domains::file_transfer::application::services::{TransferPlanner, TreeTotals};
use crate::domains::file_transfer::domain::{
    CancellationToken, ConflictResolution, DestinationGuard, EntryInfo, EntryKind,
    FileTransferError, TransferConflict, TransferMode, TransferOutcome, TransferProgress,
};
use crate::domains::shared_kernel::naming::next_available_name;

pub struct EntryTransferrer<'a> {
    file_system: &'a dyn TransferFileSystemPort,
    progress_port: &'a dyn TransferProgressPort,
    conflict_resolver: &'a dyn ConflictResolverPort,
    cancellation: &'a CancellationToken,
    mode: TransferMode,
    progress: TransferProgress,
    remembered_resolution: Option<ConflictResolution>,
    outcome: TransferOutcome,
}

impl<'a> EntryTransferrer<'a> {
    pub fn new(
        file_system: &'a dyn TransferFileSystemPort,
        progress_port: &'a dyn TransferProgressPort,
        conflict_resolver: &'a dyn ConflictResolverPort,
        cancellation: &'a CancellationToken,
        mode: TransferMode,
        totals: TreeTotals,
    ) -> Self {
        Self {
            file_system,
            progress_port,
            conflict_resolver,
            cancellation,
            mode,
            progress: TransferProgress {
                bytes_done: 0,
                bytes_total: totals.bytes,
                files_done: 0,
                files_total: totals.files,
                current_path: PathBuf::new(),
            },
            remembered_resolution: None,
            outcome: TransferOutcome::default(),
        }
    }

    pub fn run(mut self, sources: &[PathBuf], destination_directory: &Path) -> TransferOutcome {
        for source in sources {
            if self.cancellation.is_cancelled() {
                break;
            }
            self.transfer_top_level(source, destination_directory);
        }
        self.outcome.cancelled = self.cancellation.is_cancelled();
        self.outcome
    }

    fn transfer_top_level(&mut self, source: &Path, destination_directory: &Path) {
        let Some(name) = source.file_name() else {
            self.record_failure(source, FileTransferError::NotFound);
            return;
        };
        let is_already_there = DestinationGuard::is_already_in(source, destination_directory);
        if self.mode == TransferMode::Move && is_already_there {
            return;
        }

        let mut target = destination_directory.join(name);
        if is_already_there {
            let is_file = self
                .file_system
                .entry_info(source)
                .is_ok_and(|info| info.kind != EntryKind::Directory);
            target = self.unique_sibling(&target, is_file);
        }

        if self.mode == TransferMode::Move && self.try_fast_move(source, &target) {
            return;
        }
        let transferred_everything = self.transfer_entry(source, &target);
        if self.mode == TransferMode::Move
            && transferred_everything
            && !self.cancellation.is_cancelled()
        {
            if let Err(error) = self.file_system.remove_entry(source) {
                self.record_failure(source, error);
            }
        }
    }

    fn try_fast_move(&mut self, source: &Path, target: &Path) -> bool {
        if self.file_system.exists(target) {
            return false;
        }
        match self.file_system.rename(source, target) {
            Ok(()) => {
                let moved = TransferPlanner::measure(self.file_system, target);
                self.progress.bytes_done += moved.bytes;
                self.progress.files_done += moved.files;
                self.outcome.transferred_files += moved.files;
                self.progress.current_path = target.to_path_buf();
                self.report();
                true
            }
            Err(FileTransferError::CrossesDevices) => false,
            Err(error) => {
                self.record_failure(source, error);
                true
            }
        }
    }

    fn transfer_entry(&mut self, source: &Path, target: &Path) -> bool {
        if self.cancellation.is_cancelled() {
            return false;
        }
        match self.file_system.entry_info(source) {
            Ok(info) if info.kind == EntryKind::Directory => {
                self.transfer_directory(source, target, info)
            }
            Ok(info) => self.transfer_leaf(source, target, info),
            Err(error) => {
                self.record_failure(source, error);
                false
            }
        }
    }

    fn transfer_directory(&mut self, source: &Path, target: &Path, info: EntryInfo) -> bool {
        let Some(final_target) = self.prepare_target(source, target, info) else {
            return false;
        };
        if let Err(error) = self.file_system.create_directory(&final_target) {
            self.record_failure(source, error);
            return false;
        }
        let children = match self.file_system.read_children(source) {
            Ok(children) => children,
            Err(error) => {
                self.record_failure(source, error);
                return false;
            }
        };

        let mut transferred_everything = true;
        for child in children {
            let Some(child_name) = child.file_name() else {
                continue;
            };
            let child_target = final_target.join(child_name);
            transferred_everything &= self.transfer_entry(&child, &child_target);
        }
        transferred_everything
    }

    fn transfer_leaf(&mut self, source: &Path, target: &Path, info: EntryInfo) -> bool {
        let Some(final_target) = self.prepare_target(source, target, info) else {
            return false;
        };
        self.progress.current_path = source.to_path_buf();

        let file_system = self.file_system;
        let result = if info.kind == EntryKind::Symlink {
            file_system.copy_symlink(source, &final_target)
        } else {
            file_system.copy_file(source, &final_target, &mut |written_bytes| {
                self.progress.bytes_done += written_bytes;
                self.report();
                !self.cancellation.is_cancelled()
            })
        };

        match result {
            Ok(()) => {
                self.progress.files_done += 1;
                self.outcome.transferred_files += 1;
                self.report();
                true
            }
            Err(error) => {
                self.record_failure(source, error);
                false
            }
        }
    }

    fn prepare_target(&mut self, source: &Path, target: &Path, info: EntryInfo) -> Option<PathBuf> {
        let existing = match self.file_system.entry_info(target) {
            Ok(existing) => existing,
            Err(FileTransferError::NotFound) => return Some(target.to_path_buf()),
            Err(error) => {
                self.record_failure(target, error);
                return None;
            }
        };
        if info.kind == EntryKind::Directory && existing.kind == EntryKind::Directory {
            return Some(target.to_path_buf());
        }

        match self.resolve_conflict(source, target, info, existing) {
            ConflictResolution::Replace => {
                if info.kind == EntryKind::File && existing.kind == EntryKind::File {
                    return Some(target.to_path_buf());
                }
                match self.file_system.remove_entry(target) {
                    Ok(()) => Some(target.to_path_buf()),
                    Err(error) => {
                        self.record_failure(target, error);
                        None
                    }
                }
            }
            ConflictResolution::KeepBoth => {
                Some(self.unique_sibling(target, info.kind != EntryKind::Directory))
            }
            ConflictResolution::Skip => {
                self.outcome.skipped.push(source.to_path_buf());
                None
            }
            ConflictResolution::Cancel => None,
        }
    }

    fn resolve_conflict(
        &mut self,
        source: &Path,
        target: &Path,
        source_info: EntryInfo,
        target_info: EntryInfo,
    ) -> ConflictResolution {
        if let Some(resolution) = self.remembered_resolution {
            return resolution;
        }
        let decision = self.conflict_resolver.resolve(&TransferConflict {
            source: source.to_path_buf(),
            target: target.to_path_buf(),
            source_info,
            target_info,
        });
        if decision.resolution == ConflictResolution::Cancel {
            self.cancellation.cancel();
        } else if decision.apply_to_all {
            self.remembered_resolution = Some(decision.resolution);
        }
        decision.resolution
    }

    fn unique_sibling(&self, target: &Path, preserve_extension: bool) -> PathBuf {
        let (Some(parent), Some(name)) = (target.parent(), target.file_name()) else {
            return target.to_path_buf();
        };
        let existing_names: Vec<String> = self
            .file_system
            .read_children(parent)
            .unwrap_or_default()
            .iter()
            .filter_map(|path| path.file_name())
            .map(|name| name.to_string_lossy().into_owned())
            .collect();

        parent.join(next_available_name(
            &name.to_string_lossy(),
            &existing_names,
            preserve_extension,
        ))
    }

    fn record_failure(&mut self, path: &Path, error: FileTransferError) {
        if error != FileTransferError::Cancelled {
            self.outcome.failed.push((path.to_path_buf(), error));
        }
    }

    fn report(&self) {
        self.progress_port.report(&self.progress);
    }
}
