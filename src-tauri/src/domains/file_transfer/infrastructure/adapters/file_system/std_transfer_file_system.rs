use std::fs::{self, File};
use std::io::{self, Read, Write};
use std::path::{Path, PathBuf};
use std::time::UNIX_EPOCH;

use crate::domains::file_transfer::application::TransferFileSystemPort;
use crate::domains::file_transfer::domain::{EntryInfo, EntryKind, FileTransferError};

const COPY_BUFFER_BYTES: usize = 1024 * 1024;
const PARTIAL_FILE_SUFFIX: &str = ".fithuner-part";

pub struct StdTransferFileSystem;

impl TransferFileSystemPort for StdTransferFileSystem {
    fn entry_info(&self, path: &Path) -> Result<EntryInfo, FileTransferError> {
        let metadata = fs::symlink_metadata(path).map_err(map_io_error)?;
        let kind = if metadata.file_type().is_symlink() {
            EntryKind::Symlink
        } else if metadata.is_dir() {
            EntryKind::Directory
        } else {
            EntryKind::File
        };
        let modified_at_millis = metadata
            .modified()
            .ok()
            .and_then(|modified| modified.duration_since(UNIX_EPOCH).ok())
            .and_then(|elapsed| u64::try_from(elapsed.as_millis()).ok());

        Ok(EntryInfo {
            kind,
            size_in_bytes: if kind == EntryKind::File {
                metadata.len()
            } else {
                0
            },
            modified_at_millis,
        })
    }

    fn exists(&self, path: &Path) -> bool {
        fs::symlink_metadata(path).is_ok()
    }

    fn read_children(&self, directory: &Path) -> Result<Vec<PathBuf>, FileTransferError> {
        let children = fs::read_dir(directory)
            .map_err(map_io_error)?
            .filter_map(Result::ok)
            .map(|entry| entry.path())
            .collect();
        Ok(children)
    }

    fn canonicalize(&self, path: &Path) -> Result<PathBuf, FileTransferError> {
        fs::canonicalize(path).map_err(map_io_error)
    }

    fn create_directory(&self, path: &Path) -> Result<(), FileTransferError> {
        fs::create_dir_all(path).map_err(map_io_error)
    }

    fn rename(&self, from: &Path, to: &Path) -> Result<(), FileTransferError> {
        fs::rename(from, to).map_err(map_io_error)
    }

    fn remove_entry(&self, path: &Path) -> Result<(), FileTransferError> {
        let metadata = fs::symlink_metadata(path).map_err(map_io_error)?;
        let result = if metadata.is_dir() {
            fs::remove_dir_all(path)
        } else {
            fs::remove_file(path)
        };
        result.map_err(map_io_error)
    }

    #[cfg(unix)]
    fn copy_symlink(&self, source: &Path, target: &Path) -> Result<(), FileTransferError> {
        let link_destination = fs::read_link(source).map_err(map_io_error)?;
        std::os::unix::fs::symlink(link_destination, target).map_err(map_io_error)
    }

    #[cfg(not(unix))]
    fn copy_symlink(&self, _source: &Path, _target: &Path) -> Result<(), FileTransferError> {
        Err(FileTransferError::Unexpected(
            "symbolic links cannot be copied on this platform".into(),
        ))
    }

    fn copy_file(
        &self,
        source: &Path,
        target: &Path,
        on_chunk: &mut dyn FnMut(u64) -> bool,
    ) -> Result<(), FileTransferError> {
        let partial_path = partial_path_for(target);
        let result = copy_into_partial_file(source, &partial_path, on_chunk)
            .and_then(|()| fs::rename(&partial_path, target).map_err(map_io_error));

        if result.is_err() {
            let _ = fs::remove_file(&partial_path);
        }
        result
    }
}

fn partial_path_for(target: &Path) -> PathBuf {
    let mut name = target.file_name().unwrap_or_default().to_os_string();
    name.push(PARTIAL_FILE_SUFFIX);
    target.with_file_name(name)
}

fn copy_into_partial_file(
    source: &Path,
    partial_path: &Path,
    on_chunk: &mut dyn FnMut(u64) -> bool,
) -> Result<(), FileTransferError> {
    let mut input = File::open(source).map_err(map_io_error)?;
    let source_metadata = input.metadata().map_err(map_io_error)?;
    let mut output = File::create(partial_path).map_err(map_io_error)?;
    let mut buffer = vec![0u8; COPY_BUFFER_BYTES];

    loop {
        let read_bytes = input.read(&mut buffer).map_err(map_io_error)?;
        if read_bytes == 0 {
            break;
        }
        output
            .write_all(&buffer[..read_bytes])
            .map_err(map_io_error)?;
        if !on_chunk(read_bytes as u64) {
            return Err(FileTransferError::Cancelled);
        }
    }

    output.flush().map_err(map_io_error)?;
    if let Ok(modified) = source_metadata.modified() {
        let _ = output.set_modified(modified);
    }
    drop(output);
    fs::set_permissions(partial_path, source_metadata.permissions()).map_err(map_io_error)
}

fn map_io_error(error: io::Error) -> FileTransferError {
    match error.kind() {
        io::ErrorKind::NotFound => FileTransferError::NotFound,
        io::ErrorKind::PermissionDenied => FileTransferError::PermissionDenied,
        io::ErrorKind::AlreadyExists => FileTransferError::AlreadyExists,
        io::ErrorKind::CrossesDevices => FileTransferError::CrossesDevices,
        _ => FileTransferError::Unexpected(error.to_string()),
    }
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;

    use super::*;
    use crate::domains::file_transfer::application::{
        ConflictResolverPort, TransferEntries, TransferEntriesUseCase, TransferProgressPort,
    };
    use crate::domains::file_transfer::domain::{
        CancellationToken, ConflictDecision, ConflictResolution, TransferConflict, TransferMode,
        TransferProgress, TransferRequest,
    };

    struct AlwaysKeepBoth;

    impl ConflictResolverPort for AlwaysKeepBoth {
        fn resolve(&self, _conflict: &TransferConflict) -> ConflictDecision {
            ConflictDecision {
                resolution: ConflictResolution::KeepBoth,
                apply_to_all: true,
            }
        }
    }

    struct CancelOnFirstReport(CancellationToken);

    impl TransferProgressPort for CancelOnFirstReport {
        fn report(&self, _progress: &TransferProgress) {
            self.0.cancel();
        }
    }

    struct IgnoreProgress;

    impl TransferProgressPort for IgnoreProgress {
        fn report(&self, _progress: &TransferProgress) {}
    }

    fn transfer(
        mode: TransferMode,
        sources: Vec<PathBuf>,
        destination: &Path,
        progress: &dyn TransferProgressPort,
        cancellation: &CancellationToken,
    ) {
        TransferEntries::new(Arc::new(StdTransferFileSystem))
            .execute(
                TransferRequest {
                    sources,
                    destination_directory: destination.to_path_buf(),
                    mode,
                },
                progress,
                &AlwaysKeepBoth,
                cancellation,
            )
            .unwrap();
    }

    fn leftover_partial_files(directory: &Path) -> usize {
        fs::read_dir(directory)
            .unwrap()
            .filter_map(Result::ok)
            .filter(|entry| {
                entry
                    .file_name()
                    .to_string_lossy()
                    .ends_with(PARTIAL_FILE_SUFFIX)
            })
            .count()
    }

    #[test]
    fn copies_content_and_modified_time_without_leaving_partial_files() {
        let directory = tempfile::tempdir().unwrap();
        let source = directory.path().join("a.bin");
        let target = directory.path().join("b.bin");
        fs::write(&source, vec![7u8; 3 * 1024 * 1024 + 5]).unwrap();
        let mut reported_bytes = 0;

        StdTransferFileSystem
            .copy_file(&source, &target, &mut |bytes| {
                reported_bytes += bytes;
                true
            })
            .unwrap();

        assert_eq!(fs::read(&source).unwrap(), fs::read(&target).unwrap());
        assert_eq!(reported_bytes, 3 * 1024 * 1024 + 5);
        assert_eq!(
            fs::metadata(&source).unwrap().modified().unwrap(),
            fs::metadata(&target).unwrap().modified().unwrap()
        );
        assert_eq!(leftover_partial_files(directory.path()), 0);
    }

    #[test]
    fn cancelling_mid_copy_leaves_neither_target_nor_partial_file() {
        let directory = tempfile::tempdir().unwrap();
        let source = directory.path().join("big.bin");
        let target = directory.path().join("copy.bin");
        fs::write(&source, vec![1u8; 3 * 1024 * 1024]).unwrap();

        let error = StdTransferFileSystem
            .copy_file(&source, &target, &mut |_| false)
            .unwrap_err();

        assert_eq!(error, FileTransferError::Cancelled);
        assert!(!target.exists());
        assert_eq!(leftover_partial_files(directory.path()), 0);
    }

    #[test]
    fn replacing_an_existing_file_is_atomic() {
        let directory = tempfile::tempdir().unwrap();
        let source = directory.path().join("new.txt");
        let target = directory.path().join("old.txt");
        fs::write(&source, "new").unwrap();
        fs::write(&target, "old").unwrap();

        StdTransferFileSystem
            .copy_file(&source, &target, &mut |_| true)
            .unwrap();

        assert_eq!(fs::read_to_string(&target).unwrap(), "new");
    }

    #[test]
    fn end_to_end_copy_of_a_folder_tree_keeps_both_on_conflict() {
        let directory = tempfile::tempdir().unwrap();
        let source = directory.path().join("src").join("album");
        let destination = directory.path().join("dest");
        fs::create_dir_all(source.join("inner")).unwrap();
        fs::create_dir_all(destination.join("album")).unwrap();
        fs::write(source.join("one.txt"), "one").unwrap();
        fs::write(source.join("inner").join("two.txt"), "two").unwrap();
        fs::write(destination.join("album").join("one.txt"), "existing").unwrap();

        transfer(
            TransferMode::Copy,
            vec![source.clone()],
            &destination,
            &IgnoreProgress,
            &CancellationToken::default(),
        );

        let merged = destination.join("album");
        assert_eq!(
            fs::read_to_string(merged.join("one.txt")).unwrap(),
            "existing"
        );
        assert_eq!(
            fs::read_to_string(merged.join("one (2).txt")).unwrap(),
            "one"
        );
        assert_eq!(
            fs::read_to_string(merged.join("inner").join("two.txt")).unwrap(),
            "two"
        );
        assert!(source.join("one.txt").exists());
    }

    #[test]
    fn end_to_end_move_removes_the_source() {
        let directory = tempfile::tempdir().unwrap();
        let source = directory.path().join("a.txt");
        let destination = directory.path().join("dest");
        fs::create_dir(&destination).unwrap();
        fs::write(&source, "content").unwrap();

        transfer(
            TransferMode::Move,
            vec![source.clone()],
            &destination,
            &IgnoreProgress,
            &CancellationToken::default(),
        );

        assert!(!source.exists());
        assert_eq!(
            fs::read_to_string(destination.join("a.txt")).unwrap(),
            "content"
        );
    }

    #[test]
    fn end_to_end_cancel_stops_a_large_copy_and_cleans_up() {
        let directory = tempfile::tempdir().unwrap();
        let source = directory.path().join("big.bin");
        let destination = directory.path().join("dest");
        fs::create_dir(&destination).unwrap();
        fs::write(&source, vec![9u8; 4 * 1024 * 1024]).unwrap();
        let cancellation = CancellationToken::default();

        transfer(
            TransferMode::Copy,
            vec![source],
            &destination,
            &CancelOnFirstReport(cancellation.clone()),
            &cancellation,
        );

        assert!(!destination.join("big.bin").exists());
        assert_eq!(leftover_partial_files(&destination), 0);
    }

    #[cfg(unix)]
    #[test]
    fn copies_symlinks_as_symlinks() {
        let directory = tempfile::tempdir().unwrap();
        let real_file = directory.path().join("real.txt");
        let link = directory.path().join("link.txt");
        let copied_link = directory.path().join("copied-link.txt");
        fs::write(&real_file, "x").unwrap();
        std::os::unix::fs::symlink(&real_file, &link).unwrap();

        StdTransferFileSystem
            .copy_symlink(&link, &copied_link)
            .unwrap();

        assert_eq!(fs::read_link(&copied_link).unwrap(), real_file);
    }
}
