use std::path::{Path, PathBuf};

use crate::domain::{FileEntry, FileSystemError, Place};

pub trait FileSystemPort: Send + Sync {
    fn read_directory(&self, path: &Path) -> Result<Vec<FileEntry>, FileSystemError>;
    fn home_directory(&self) -> Option<PathBuf>;
}

pub trait PlacesProviderPort: Send + Sync {
    fn available_places(&self) -> Vec<Place>;
}
