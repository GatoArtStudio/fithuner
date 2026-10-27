use std::path::PathBuf;

use crate::domains::folder_watching::domain::FolderWatchingError;

pub trait FolderWatcherPort: Send + Sync {
    /// Watches exactly `folders` (not their subfolders); folders that cannot be watched are skipped.
    fn replace_watched(&self, folders: &[PathBuf]) -> Result<(), FolderWatchingError>;
}
