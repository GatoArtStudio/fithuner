use std::path::PathBuf;

use crate::domains::directory_browsing::domain::{DirectoryListing, FileSystemError};

pub trait ListDirectoryUseCase: Send + Sync {
    fn execute(&self, requested_path: Option<PathBuf>)
    -> Result<DirectoryListing, FileSystemError>;
}
