use std::path::PathBuf;

use crate::domains::folder_watching::application::FolderWatcherPort;
use crate::domains::folder_watching::domain::FolderWatchingError;

/// Used when the operating system cannot provide a watcher, so the app still works without live updates.
pub struct NoopFolderWatcher;

impl FolderWatcherPort for NoopFolderWatcher {
    fn replace_watched(&self, _folders: &[PathBuf]) -> Result<(), FolderWatchingError> {
        Ok(())
    }
}
