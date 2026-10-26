use std::path::PathBuf;
use std::sync::Arc;

use crate::domains::directory_browsing::application::ports::{
    FileSystemPort, ListDirectoryUseCase,
};
use crate::domains::directory_browsing::domain::{DirectoryListing, FileSystemError};

pub struct ListDirectory {
    file_system: Arc<dyn FileSystemPort>,
}

impl ListDirectory {
    pub fn new(file_system: Arc<dyn FileSystemPort>) -> Self {
        Self { file_system }
    }
}

impl ListDirectoryUseCase for ListDirectory {
    fn execute(
        &self,
        requested_path: Option<PathBuf>,
    ) -> Result<DirectoryListing, FileSystemError> {
        let path = match requested_path {
            Some(path) => path,
            None => self
                .file_system
                .home_directory()
                .ok_or(FileSystemError::NotFound)?,
        };
        let entries = self.file_system.read_directory(&path)?;
        let parent_path = path.parent().map(PathBuf::from);

        Ok(DirectoryListing {
            path,
            parent_path,
            entries,
        })
    }
}

#[cfg(test)]
mod tests {
    use std::path::Path;

    use super::*;
    use crate::domains::directory_browsing::domain::{FileEntry, FileEntryKind};

    struct FakeFileSystem {
        home: Option<PathBuf>,
        result: Result<Vec<FileEntry>, FileSystemError>,
    }

    impl FileSystemPort for FakeFileSystem {
        fn read_directory(&self, _path: &Path) -> Result<Vec<FileEntry>, FileSystemError> {
            self.result.clone()
        }

        fn home_directory(&self) -> Option<PathBuf> {
            self.home.clone()
        }
    }

    fn sample_entry() -> FileEntry {
        FileEntry {
            name: "notes.txt".into(),
            path: PathBuf::from("/data/notes.txt"),
            kind: FileEntryKind::File,
            is_symlink: false,
            is_hidden: false,
            size_in_bytes: 12,
            modified_at_millis: None,
        }
    }

    fn use_case(
        home: Option<&str>,
        result: Result<Vec<FileEntry>, FileSystemError>,
    ) -> ListDirectory {
        ListDirectory::new(Arc::new(FakeFileSystem {
            home: home.map(PathBuf::from),
            result,
        }))
    }

    #[test]
    fn lists_the_requested_directory_with_its_parent() {
        let listing = use_case(None, Ok(vec![sample_entry()]))
            .execute(Some(PathBuf::from("/data")))
            .unwrap();

        assert_eq!(listing.path, PathBuf::from("/data"));
        assert_eq!(listing.parent_path, Some(PathBuf::from("/")));
        assert_eq!(listing.entries, vec![sample_entry()]);
    }

    #[test]
    fn falls_back_to_the_home_directory_when_no_path_is_requested() {
        let listing = use_case(Some("/home/user"), Ok(vec![]))
            .execute(None)
            .unwrap();

        assert_eq!(listing.path, PathBuf::from("/home/user"));
    }

    #[test]
    fn root_directory_has_no_parent() {
        let listing = use_case(None, Ok(vec![]))
            .execute(Some(PathBuf::from("/")))
            .unwrap();

        assert_eq!(listing.parent_path, None);
    }

    #[test]
    fn fails_when_no_path_is_requested_and_home_is_unknown() {
        let error = use_case(None, Ok(vec![])).execute(None).unwrap_err();

        assert_eq!(error, FileSystemError::NotFound);
    }

    #[test]
    fn propagates_file_system_errors() {
        let error = use_case(None, Err(FileSystemError::PermissionDenied))
            .execute(Some(PathBuf::from("/root")))
            .unwrap_err();

        assert_eq!(error, FileSystemError::PermissionDenied);
    }
}
