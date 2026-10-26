use std::path::{Path, PathBuf};

use crate::domains::directory_browsing::domain::{FileEntry, FileSystemError};

pub trait FileSystemPort: Send + Sync {
    fn read_directory(&self, path: &Path) -> Result<Vec<FileEntry>, FileSystemError>;
    fn home_directory(&self) -> Option<PathBuf>;
}
