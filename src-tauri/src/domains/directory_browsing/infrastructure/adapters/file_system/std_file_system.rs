use std::fs::{self, Metadata};
use std::io;
use std::path::{Path, PathBuf};
use std::time::UNIX_EPOCH;

use crate::domains::directory_browsing::application::FileSystemPort;
use crate::domains::directory_browsing::domain::{FileEntry, FileEntryKind, FileSystemError};
use crate::domains::shared_kernel::filesystem::is_hidden_entry;

pub struct StdFileSystem;

impl FileSystemPort for StdFileSystem {
    fn read_directory(&self, path: &Path) -> Result<Vec<FileEntry>, FileSystemError> {
        let metadata = fs::metadata(path).map_err(map_io_error)?;
        if !metadata.is_dir() {
            return Err(FileSystemError::NotADirectory);
        }

        let entries = fs::read_dir(path)
            .map_err(map_io_error)?
            .filter_map(Result::ok)
            .filter_map(|directory_entry| build_file_entry(&directory_entry.path()))
            .collect();

        Ok(entries)
    }

    fn home_directory(&self) -> Option<PathBuf> {
        dirs::home_dir()
    }
}

fn build_file_entry(path: &Path) -> Option<FileEntry> {
    let link_metadata = fs::symlink_metadata(path).ok()?;
    let is_symlink = link_metadata.file_type().is_symlink();
    let metadata = if is_symlink {
        fs::metadata(path).unwrap_or(link_metadata)
    } else {
        link_metadata
    };
    let name = path.file_name()?.to_string_lossy().into_owned();

    Some(FileEntry {
        is_hidden: is_hidden_entry(&name, &metadata),
        name,
        path: path.to_path_buf(),
        kind: if metadata.is_dir() {
            FileEntryKind::Directory
        } else {
            FileEntryKind::File
        },
        is_symlink,
        size_in_bytes: if metadata.is_dir() { 0 } else { metadata.len() },
        modified_at_millis: modified_at_millis(&metadata),
    })
}

fn modified_at_millis(metadata: &Metadata) -> Option<u64> {
    let modified = metadata.modified().ok()?;
    let elapsed = modified.duration_since(UNIX_EPOCH).ok()?;
    u64::try_from(elapsed.as_millis()).ok()
}

fn map_io_error(error: io::Error) -> FileSystemError {
    match error.kind() {
        io::ErrorKind::NotFound => FileSystemError::NotFound,
        io::ErrorKind::PermissionDenied => FileSystemError::PermissionDenied,
        _ => FileSystemError::Unexpected(error.to_string()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn entry_named<'a>(entries: &'a [FileEntry], name: &str) -> &'a FileEntry {
        entries.iter().find(|entry| entry.name == name).unwrap()
    }

    #[test]
    fn reads_files_folders_and_hidden_entries() {
        let directory = tempfile::tempdir().unwrap();
        fs::write(directory.path().join("report.txt"), "hello").unwrap();
        fs::write(directory.path().join(".secret"), "").unwrap();
        fs::create_dir(directory.path().join("photos")).unwrap();

        let entries = StdFileSystem.read_directory(directory.path()).unwrap();

        assert_eq!(entries.len(), 3);
        let report = entry_named(&entries, "report.txt");
        assert_eq!(report.kind, FileEntryKind::File);
        assert_eq!(report.size_in_bytes, 5);
        assert!(!report.is_hidden);
        assert!(entry_named(&entries, ".secret").is_hidden);
        assert_eq!(
            entry_named(&entries, "photos").kind,
            FileEntryKind::Directory
        );
    }

    #[test]
    fn reports_a_missing_directory() {
        let directory = tempfile::tempdir().unwrap();

        let error = StdFileSystem
            .read_directory(&directory.path().join("missing"))
            .unwrap_err();

        assert_eq!(error, FileSystemError::NotFound);
    }

    #[test]
    fn rejects_a_file_path() {
        let directory = tempfile::tempdir().unwrap();
        let file_path = directory.path().join("file.txt");
        fs::write(&file_path, "").unwrap();

        let error = StdFileSystem.read_directory(&file_path).unwrap_err();

        assert_eq!(error, FileSystemError::NotADirectory);
    }

    #[cfg(unix)]
    #[test]
    fn treats_a_symlink_to_a_folder_as_a_folder() {
        let directory = tempfile::tempdir().unwrap();
        fs::create_dir(directory.path().join("target")).unwrap();
        std::os::unix::fs::symlink(
            directory.path().join("target"),
            directory.path().join("link"),
        )
        .unwrap();

        let entries = StdFileSystem.read_directory(directory.path()).unwrap();

        let link = entry_named(&entries, "link");
        assert_eq!(link.kind, FileEntryKind::Directory);
        assert!(link.is_symlink);
    }
}
