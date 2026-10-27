use std::path::PathBuf;

use crate::domains::folder_watching::domain::FolderWatchingError;

pub trait UpdateWatchedFoldersUseCase: Send + Sync {
    /// Makes `folders` the complete set of folders being watched.
    fn execute(&self, folders: Vec<PathBuf>) -> Result<(), FolderWatchingError>;
}
