use std::fs::{self, OpenOptions};
use std::io;
use std::path::Path;

use crate::domains::file_operations::application::EntryWriterPort;
use crate::domains::file_operations::domain::FileOperationError;

pub struct StdEntryWriter;

impl EntryWriterPort for StdEntryWriter {
    fn entry_exists(&self, path: &Path) -> bool {
        fs::symlink_metadata(path).is_ok()
    }

    fn list_entry_names(&self, directory: &Path) -> Result<Vec<String>, FileOperationError> {
        let names = fs::read_dir(directory)
            .map_err(map_io_error)?
            .filter_map(Result::ok)
            .map(|entry| entry.file_name().to_string_lossy().into_owned())
            .collect();
        Ok(names)
    }

    fn create_file(&self, path: &Path) -> Result<(), FileOperationError> {
        OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(path)
            .map(drop)
            .map_err(map_io_error)
    }

    fn create_directory(&self, path: &Path) -> Result<(), FileOperationError> {
        fs::create_dir(path).map_err(map_io_error)
    }

    fn rename(&self, from: &Path, to: &Path) -> Result<(), FileOperationError> {
        fs::rename(from, to).map_err(map_io_error)
    }

    fn delete_permanently(&self, path: &Path) -> Result<(), FileOperationError> {
        let metadata = fs::symlink_metadata(path).map_err(map_io_error)?;
        let result = if metadata.is_dir() {
            fs::remove_dir_all(path)
        } else {
            fs::remove_file(path)
        };
        result.map_err(map_io_error)
    }
}

fn map_io_error(error: io::Error) -> FileOperationError {
    match error.kind() {
        io::ErrorKind::NotFound => FileOperationError::NotFound,
        io::ErrorKind::PermissionDenied => FileOperationError::PermissionDenied,
        io::ErrorKind::AlreadyExists => FileOperationError::AlreadyExists,
        _ => FileOperationError::Unexpected(error.to_string()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn creates_a_file_and_refuses_to_overwrite_it() {
        let directory = tempfile::tempdir().unwrap();
        let path = directory.path().join("note.txt");

        StdEntryWriter.create_file(&path).unwrap();
        let error = StdEntryWriter.create_file(&path).unwrap_err();

        assert!(path.is_file());
        assert_eq!(error, FileOperationError::AlreadyExists);
    }

    #[test]
    fn creates_a_directory() {
        let directory = tempfile::tempdir().unwrap();
        let path = directory.path().join("folder");

        StdEntryWriter.create_directory(&path).unwrap();

        assert!(path.is_dir());
    }

    #[test]
    fn renames_an_entry() {
        let directory = tempfile::tempdir().unwrap();
        let original = directory.path().join("a.txt");
        let renamed = directory.path().join("b.txt");
        fs::write(&original, "content").unwrap();

        StdEntryWriter.rename(&original, &renamed).unwrap();

        assert!(!original.exists());
        assert_eq!(fs::read_to_string(renamed).unwrap(), "content");
    }

    #[test]
    fn deletes_files_and_non_empty_directories() {
        let directory = tempfile::tempdir().unwrap();
        let file = directory.path().join("a.txt");
        let folder = directory.path().join("folder");
        fs::write(&file, "").unwrap();
        fs::create_dir(&folder).unwrap();
        fs::write(folder.join("inner.txt"), "").unwrap();

        StdEntryWriter.delete_permanently(&file).unwrap();
        StdEntryWriter.delete_permanently(&folder).unwrap();

        assert!(!file.exists() && !folder.exists());
    }

    #[test]
    fn reports_a_missing_entry_on_delete() {
        let directory = tempfile::tempdir().unwrap();

        let error = StdEntryWriter
            .delete_permanently(&directory.path().join("missing"))
            .unwrap_err();

        assert_eq!(error, FileOperationError::NotFound);
    }

    #[test]
    fn lists_entry_names() {
        let directory = tempfile::tempdir().unwrap();
        fs::write(directory.path().join("a.txt"), "").unwrap();

        let names = StdEntryWriter.list_entry_names(directory.path()).unwrap();

        assert_eq!(names, vec!["a.txt".to_string()]);
    }
}
