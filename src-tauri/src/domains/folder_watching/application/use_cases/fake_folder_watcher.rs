use std::path::PathBuf;
use std::sync::Mutex;

use crate::domains::folder_watching::application::ports::FolderWatcherPort;
use crate::domains::folder_watching::domain::FolderWatchingError;

#[derive(Default)]
pub struct FakeFolderWatcher {
    pub calls: Mutex<Vec<Vec<PathBuf>>>,
}

impl FolderWatcherPort for FakeFolderWatcher {
    fn replace_watched(&self, folders: &[PathBuf]) -> Result<(), FolderWatchingError> {
        self.calls.lock().unwrap().push(folders.to_vec());
        Ok(())
    }
}
