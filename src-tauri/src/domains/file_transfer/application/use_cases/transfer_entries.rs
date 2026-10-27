use std::path::{Path, PathBuf};
use std::sync::Arc;

use crate::domains::file_transfer::application::ports::{
    ConflictResolverPort, TransferEntriesUseCase, TransferFileSystemPort, TransferProgressPort,
};
use crate::domains::file_transfer::application::services::{
    EntryTransferrer, TransferPlanner, TreeTotals,
};
use crate::domains::file_transfer::domain::{
    CancellationToken, DestinationGuard, EntryKind, FileTransferError, TransferOutcome,
    TransferRequest,
};

pub struct TransferEntries {
    file_system: Arc<dyn TransferFileSystemPort>,
}

impl TransferEntries {
    pub fn new(file_system: Arc<dyn TransferFileSystemPort>) -> Self {
        Self { file_system }
    }

    fn canonical_source(&self, source: &Path) -> Result<PathBuf, FileTransferError> {
        let (Some(parent), Some(name)) = (source.parent(), source.file_name()) else {
            return Err(FileTransferError::NotFound);
        };
        Ok(self.file_system.canonicalize(parent)?.join(name))
    }
}

impl TransferEntriesUseCase for TransferEntries {
    fn execute(
        &self,
        request: TransferRequest,
        progress: &dyn TransferProgressPort,
        conflict_resolver: &dyn ConflictResolverPort,
        cancellation: &CancellationToken,
    ) -> Result<TransferOutcome, FileTransferError> {
        let destination = self
            .file_system
            .canonicalize(&request.destination_directory)?;
        if self.file_system.entry_info(&destination)?.kind != EntryKind::Directory {
            return Err(FileTransferError::InvalidDestination(
                "the destination is not a folder".into(),
            ));
        }
        let sources = request
            .sources
            .iter()
            .map(|source| self.canonical_source(source))
            .collect::<Result<Vec<_>, _>>()?;
        DestinationGuard::ensure_not_inside_sources(&sources, &destination)?;

        let totals = sources
            .iter()
            .map(|source| TransferPlanner::measure(self.file_system.as_ref(), source))
            .fold(TreeTotals::default(), TreeTotals::plus);

        Ok(EntryTransferrer::new(
            self.file_system.as_ref(),
            progress,
            conflict_resolver,
            cancellation,
            request.mode,
            totals,
        )
        .run(&sources, &destination))
    }
}

#[cfg(test)]
mod tests {
    use std::collections::VecDeque;
    use std::sync::Mutex;

    use super::*;
    use crate::domains::file_transfer::application::services::FakeTransferFileSystem;
    use crate::domains::file_transfer::domain::{
        ConflictDecision, ConflictResolution, TransferConflict, TransferMode, TransferProgress,
    };

    #[derive(Default)]
    struct ScriptedResolver {
        decisions: Mutex<VecDeque<ConflictDecision>>,
        questions: Mutex<Vec<TransferConflict>>,
    }

    impl ScriptedResolver {
        fn answering(decisions: &[(ConflictResolution, bool)]) -> Self {
            Self {
                decisions: Mutex::new(
                    decisions
                        .iter()
                        .map(|(resolution, apply_to_all)| ConflictDecision {
                            resolution: *resolution,
                            apply_to_all: *apply_to_all,
                        })
                        .collect(),
                ),
                questions: Mutex::default(),
            }
        }

        fn question_count(&self) -> usize {
            self.questions.lock().unwrap().len()
        }
    }

    impl ConflictResolverPort for ScriptedResolver {
        fn resolve(&self, conflict: &TransferConflict) -> ConflictDecision {
            self.questions.lock().unwrap().push(conflict.clone());
            self.decisions
                .lock()
                .unwrap()
                .pop_front()
                .unwrap_or(ConflictDecision {
                    resolution: ConflictResolution::Skip,
                    apply_to_all: false,
                })
        }
    }

    #[derive(Default)]
    struct RecordingProgress {
        reports: Mutex<Vec<TransferProgress>>,
    }

    impl TransferProgressPort for RecordingProgress {
        fn report(&self, progress: &TransferProgress) {
            self.reports.lock().unwrap().push(progress.clone());
        }
    }

    fn run(
        file_system: &Arc<FakeTransferFileSystem>,
        mode: TransferMode,
        sources: &[&str],
        destination: &str,
        resolver: &ScriptedResolver,
    ) -> Result<TransferOutcome, FileTransferError> {
        run_with(
            file_system,
            mode,
            sources,
            destination,
            resolver,
            &RecordingProgress::default(),
            &CancellationToken::default(),
        )
    }

    fn run_with(
        file_system: &Arc<FakeTransferFileSystem>,
        mode: TransferMode,
        sources: &[&str],
        destination: &str,
        resolver: &ScriptedResolver,
        progress: &RecordingProgress,
        cancellation: &CancellationToken,
    ) -> Result<TransferOutcome, FileTransferError> {
        TransferEntries::new(file_system.clone()).execute(
            TransferRequest {
                sources: sources.iter().map(PathBuf::from).collect(),
                destination_directory: PathBuf::from(destination),
                mode,
            },
            progress,
            resolver,
            cancellation,
        )
    }

    fn fixture() -> Arc<FakeTransferFileSystem> {
        let file_system = Arc::new(FakeTransferFileSystem::new());
        file_system.add_directory("/dest");
        file_system
    }

    #[test]
    fn copies_a_file_and_reports_progress() {
        let file_system = fixture();
        file_system.add_file("/src/a.txt", 100);
        let progress = RecordingProgress::default();

        let outcome = run_with(
            &file_system,
            TransferMode::Copy,
            &["/src/a.txt"],
            "/dest",
            &ScriptedResolver::default(),
            &progress,
            &CancellationToken::default(),
        )
        .unwrap();

        assert_eq!(file_system.file_size("/dest/a.txt"), Some(100));
        assert!(file_system.contains("/src/a.txt"));
        assert_eq!(outcome.transferred_files, 1);
        let last_report = progress.reports.lock().unwrap().last().cloned().unwrap();
        assert_eq!(
            (last_report.bytes_done, last_report.bytes_total),
            (100, 100)
        );
        assert_eq!((last_report.files_done, last_report.files_total), (1, 1));
    }

    #[test]
    fn copies_a_folder_tree_including_empty_folders() {
        let file_system = fixture();
        file_system.add_file("/src/album/one.jpg", 10);
        file_system.add_file("/src/album/inner/two.jpg", 20);
        file_system.add_directory("/src/album/empty");

        run(
            &file_system,
            TransferMode::Copy,
            &["/src/album"],
            "/dest",
            &ScriptedResolver::default(),
        )
        .unwrap();

        assert_eq!(file_system.file_size("/dest/album/one.jpg"), Some(10));
        assert_eq!(file_system.file_size("/dest/album/inner/two.jpg"), Some(20));
        assert!(file_system.contains("/dest/album/empty"));
    }

    #[test]
    fn replace_overwrites_the_target_file() {
        let file_system = fixture();
        file_system.add_file("/src/a.txt", 100);
        file_system.add_file("/dest/a.txt", 5);
        let resolver = ScriptedResolver::answering(&[(ConflictResolution::Replace, false)]);

        run(
            &file_system,
            TransferMode::Copy,
            &["/src/a.txt"],
            "/dest",
            &resolver,
        )
        .unwrap();

        assert_eq!(file_system.file_size("/dest/a.txt"), Some(100));
    }

    #[test]
    fn skip_keeps_the_target_and_records_the_skipped_source() {
        let file_system = fixture();
        file_system.add_file("/src/a.txt", 100);
        file_system.add_file("/dest/a.txt", 5);
        let resolver = ScriptedResolver::answering(&[(ConflictResolution::Skip, false)]);

        let outcome = run(
            &file_system,
            TransferMode::Copy,
            &["/src/a.txt"],
            "/dest",
            &resolver,
        )
        .unwrap();

        assert_eq!(file_system.file_size("/dest/a.txt"), Some(5));
        assert_eq!(outcome.skipped, vec![PathBuf::from("/src/a.txt")]);
    }

    #[test]
    fn keep_both_creates_a_numbered_copy() {
        let file_system = fixture();
        file_system.add_file("/src/a.txt", 100);
        file_system.add_file("/dest/a.txt", 5);
        let resolver = ScriptedResolver::answering(&[(ConflictResolution::KeepBoth, false)]);

        run(
            &file_system,
            TransferMode::Copy,
            &["/src/a.txt"],
            "/dest",
            &resolver,
        )
        .unwrap();

        assert_eq!(file_system.file_size("/dest/a.txt"), Some(5));
        assert_eq!(file_system.file_size("/dest/a (2).txt"), Some(100));
    }

    #[test]
    fn apply_to_all_asks_only_once() {
        let file_system = fixture();
        file_system.add_file("/src/a.txt", 1);
        file_system.add_file("/src/b.txt", 2);
        file_system.add_file("/dest/a.txt", 9);
        file_system.add_file("/dest/b.txt", 9);
        let resolver = ScriptedResolver::answering(&[(ConflictResolution::Replace, true)]);

        run(
            &file_system,
            TransferMode::Copy,
            &["/src/a.txt", "/src/b.txt"],
            "/dest",
            &resolver,
        )
        .unwrap();

        assert_eq!(resolver.question_count(), 1);
        assert_eq!(file_system.file_size("/dest/a.txt"), Some(1));
        assert_eq!(file_system.file_size("/dest/b.txt"), Some(2));
    }

    #[test]
    fn merges_folders_without_asking_and_only_asks_for_conflicting_files() {
        let file_system = fixture();
        file_system.add_file("/src/album/new.jpg", 1);
        file_system.add_file("/src/album/same.jpg", 2);
        file_system.add_file("/dest/album/same.jpg", 9);
        file_system.add_file("/dest/album/old.jpg", 3);
        let resolver = ScriptedResolver::answering(&[(ConflictResolution::Skip, false)]);

        run(
            &file_system,
            TransferMode::Copy,
            &["/src/album"],
            "/dest",
            &resolver,
        )
        .unwrap();

        assert_eq!(resolver.question_count(), 1);
        assert_eq!(file_system.file_size("/dest/album/new.jpg"), Some(1));
        assert_eq!(file_system.file_size("/dest/album/old.jpg"), Some(3));
        assert_eq!(file_system.file_size("/dest/album/same.jpg"), Some(9));
    }

    #[test]
    fn copying_into_the_same_folder_creates_a_numbered_copy_without_asking() {
        let file_system = fixture();
        file_system.add_file("/dest/a.txt", 7);
        let resolver = ScriptedResolver::default();

        run(
            &file_system,
            TransferMode::Copy,
            &["/dest/a.txt"],
            "/dest",
            &resolver,
        )
        .unwrap();

        assert_eq!(file_system.file_size("/dest/a (2).txt"), Some(7));
        assert_eq!(resolver.question_count(), 0);
    }

    #[test]
    fn moving_on_the_same_device_renames_the_source() {
        let file_system = fixture();
        file_system.add_file("/src/album/one.jpg", 10);

        let outcome = run(
            &file_system,
            TransferMode::Move,
            &["/src/album"],
            "/dest",
            &ScriptedResolver::default(),
        )
        .unwrap();

        assert!(!file_system.contains("/src/album"));
        assert_eq!(file_system.file_size("/dest/album/one.jpg"), Some(10));
        assert_eq!(outcome.transferred_files, 1);
    }

    #[test]
    fn moving_across_devices_copies_then_deletes_the_source() {
        let file_system = Arc::new(FakeTransferFileSystem::new().on_another_device());
        file_system.add_directory("/dest");
        file_system.add_file("/src/album/one.jpg", 10);

        run(
            &file_system,
            TransferMode::Move,
            &["/src/album"],
            "/dest",
            &ScriptedResolver::default(),
        )
        .unwrap();

        assert!(!file_system.contains("/src/album"));
        assert_eq!(file_system.file_size("/dest/album/one.jpg"), Some(10));
    }

    #[test]
    fn a_skipped_file_keeps_the_source_folder_of_a_move() {
        let file_system = Arc::new(FakeTransferFileSystem::new().on_another_device());
        file_system.add_file("/src/album/one.jpg", 10);
        file_system.add_file("/dest/album/one.jpg", 99);
        let resolver = ScriptedResolver::answering(&[(ConflictResolution::Skip, false)]);

        run(
            &file_system,
            TransferMode::Move,
            &["/src/album"],
            "/dest",
            &resolver,
        )
        .unwrap();

        assert!(file_system.contains("/src/album/one.jpg"));
        assert_eq!(file_system.file_size("/dest/album/one.jpg"), Some(99));
    }

    #[test]
    fn moving_into_the_same_folder_does_nothing() {
        let file_system = fixture();
        file_system.add_file("/dest/a.txt", 7);

        let outcome = run(
            &file_system,
            TransferMode::Move,
            &["/dest/a.txt"],
            "/dest",
            &ScriptedResolver::default(),
        )
        .unwrap();

        assert_eq!(file_system.file_size("/dest/a.txt"), Some(7));
        assert_eq!(outcome.transferred_files, 0);
    }

    #[test]
    fn rejects_a_destination_inside_a_source_folder() {
        let file_system = fixture();
        file_system.add_file("/src/album/one.jpg", 1);
        file_system.add_directory("/src/album/inner");

        let result = run(
            &file_system,
            TransferMode::Copy,
            &["/src/album"],
            "/src/album/inner",
            &ScriptedResolver::default(),
        );

        assert!(matches!(
            result,
            Err(FileTransferError::InvalidDestination(_))
        ));
    }

    #[test]
    fn a_cancel_decision_stops_the_remaining_sources() {
        let file_system = fixture();
        file_system.add_file("/src/a.txt", 1);
        file_system.add_file("/src/b.txt", 2);
        file_system.add_file("/dest/a.txt", 9);
        let resolver = ScriptedResolver::answering(&[(ConflictResolution::Cancel, false)]);

        let outcome = run(
            &file_system,
            TransferMode::Copy,
            &["/src/a.txt", "/src/b.txt"],
            "/dest",
            &resolver,
        )
        .unwrap();

        assert!(outcome.cancelled);
        assert!(!file_system.contains("/dest/b.txt"));
        assert_eq!(file_system.file_size("/dest/a.txt"), Some(9));
    }

    #[test]
    fn an_already_cancelled_token_transfers_nothing() {
        let file_system = fixture();
        file_system.add_file("/src/a.txt", 1);
        let cancellation = CancellationToken::default();
        cancellation.cancel();

        let outcome = run_with(
            &file_system,
            TransferMode::Copy,
            &["/src/a.txt"],
            "/dest",
            &ScriptedResolver::default(),
            &RecordingProgress::default(),
            &cancellation,
        )
        .unwrap();

        assert!(outcome.cancelled);
        assert!(!file_system.contains("/dest/a.txt"));
    }

    #[test]
    fn collects_failures_and_keeps_transferring_the_rest() {
        let file_system = fixture();
        file_system.add_file("/src/locked.txt", 1);
        file_system.add_file("/src/fine.txt", 2);
        file_system.make_unreadable("/src/locked.txt");

        let outcome = run(
            &file_system,
            TransferMode::Copy,
            &["/src/locked.txt", "/src/fine.txt"],
            "/dest",
            &ScriptedResolver::default(),
        )
        .unwrap();

        assert_eq!(file_system.file_size("/dest/fine.txt"), Some(2));
        assert_eq!(
            outcome.failed,
            vec![(
                PathBuf::from("/src/locked.txt"),
                FileTransferError::PermissionDenied
            )]
        );
    }

    fn entries(outcome: &TransferOutcome) -> Vec<(String, String)> {
        outcome
            .transferred
            .iter()
            .map(|entry| {
                (
                    entry.from.to_string_lossy().into_owned(),
                    entry.to.to_string_lossy().into_owned(),
                )
            })
            .collect()
    }

    #[test]
    fn reports_where_a_copy_was_created() {
        let file_system = fixture();
        file_system.add_file("/src/a.txt", 1);
        file_system.add_file("/src/b.txt", 1);

        let outcome = run(
            &file_system,
            TransferMode::Copy,
            &["/src/a.txt", "/src/b.txt"],
            "/dest",
            &ScriptedResolver::default(),
        )
        .unwrap();

        assert_eq!(
            entries(&outcome),
            vec![
                ("/src/a.txt".into(), "/dest/a.txt".into()),
                ("/src/b.txt".into(), "/dest/b.txt".into())
            ]
        );
    }

    #[test]
    fn reports_a_fast_move_and_a_move_across_devices() {
        let file_system = fixture();
        file_system.add_file("/src/a.txt", 1);
        let fast = run(
            &file_system,
            TransferMode::Move,
            &["/src/a.txt"],
            "/dest",
            &ScriptedResolver::default(),
        )
        .unwrap();
        assert_eq!(
            entries(&fast),
            vec![("/src/a.txt".into(), "/dest/a.txt".into())]
        );

        let slow_system = Arc::new(FakeTransferFileSystem::new().on_another_device());
        slow_system.add_directory("/dest");
        slow_system.add_file("/src/album/one.jpg", 10);
        let slow = run(
            &slow_system,
            TransferMode::Move,
            &["/src/album"],
            "/dest",
            &ScriptedResolver::default(),
        )
        .unwrap();
        assert_eq!(
            entries(&slow),
            vec![("/src/album".into(), "/dest/album".into())]
        );
    }

    #[test]
    fn reports_the_numbered_name_when_both_are_kept() {
        let file_system = fixture();
        file_system.add_file("/src/a.txt", 100);
        file_system.add_file("/dest/a.txt", 5);
        let resolver = ScriptedResolver::answering(&[(ConflictResolution::KeepBoth, false)]);

        let outcome = run(
            &file_system,
            TransferMode::Copy,
            &["/src/a.txt"],
            "/dest",
            &resolver,
        )
        .unwrap();

        assert_eq!(
            entries(&outcome),
            vec![("/src/a.txt".into(), "/dest/a (2).txt".into())]
        );
    }

    #[test]
    fn reports_the_numbered_copy_made_in_the_same_folder() {
        let file_system = fixture();
        file_system.add_file("/dest/a.txt", 7);

        let outcome = run(
            &file_system,
            TransferMode::Copy,
            &["/dest/a.txt"],
            "/dest",
            &ScriptedResolver::default(),
        )
        .unwrap();

        assert_eq!(
            entries(&outcome),
            vec![("/dest/a.txt".into(), "/dest/a (2).txt".into())]
        );
    }

    #[test]
    fn leaves_out_replacements_merges_skips_and_incomplete_moves() {
        let file_system = fixture();
        file_system.add_file("/src/a.txt", 100);
        file_system.add_file("/dest/a.txt", 5);
        let replaced = run(
            &file_system,
            TransferMode::Copy,
            &["/src/a.txt"],
            "/dest",
            &ScriptedResolver::answering(&[(ConflictResolution::Replace, false)]),
        )
        .unwrap();
        assert!(replaced.transferred.is_empty());

        let merge_system = fixture();
        merge_system.add_file("/src/album/one.jpg", 1);
        merge_system.add_file("/dest/album/two.jpg", 1);
        let merged = run(
            &merge_system,
            TransferMode::Copy,
            &["/src/album"],
            "/dest",
            &ScriptedResolver::default(),
        )
        .unwrap();
        assert!(merged.transferred.is_empty());

        let skip_system = fixture();
        skip_system.add_file("/src/a.txt", 100);
        skip_system.add_file("/dest/a.txt", 5);
        let skipped = run(
            &skip_system,
            TransferMode::Copy,
            &["/src/a.txt"],
            "/dest",
            &ScriptedResolver::answering(&[(ConflictResolution::Skip, false)]),
        )
        .unwrap();
        assert!(skipped.transferred.is_empty());

        let partial_system = Arc::new(FakeTransferFileSystem::new().on_another_device());
        partial_system.add_file("/src/album/one.jpg", 10);
        partial_system.add_file("/dest/album/one.jpg", 99);
        let partial = run(
            &partial_system,
            TransferMode::Move,
            &["/src/album"],
            "/dest",
            &ScriptedResolver::answering(&[(ConflictResolution::Skip, false)]),
        )
        .unwrap();
        assert!(partial.transferred.is_empty());
    }
}
