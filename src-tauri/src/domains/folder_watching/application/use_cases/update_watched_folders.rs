use std::path::PathBuf;
use std::sync::Arc;

use crate::domains::folder_watching::application::ports::{
    FolderWatcherPort, UpdateWatchedFoldersUseCase,
};
use crate::domains::folder_watching::domain::{FolderWatchingError, MAX_WATCHED_FOLDERS};

pub struct UpdateWatchedFolders {
    watcher: Arc<dyn FolderWatcherPort>,
}

impl UpdateWatchedFolders {
    pub fn new(watcher: Arc<dyn FolderWatcherPort>) -> Self {
        Self { watcher }
    }
}

impl UpdateWatchedFoldersUseCase for UpdateWatchedFolders {
    fn execute(&self, folders: Vec<PathBuf>) -> Result<(), FolderWatchingError> {
        let mut unique: Vec<PathBuf> = Vec::new();
        for folder in folders {
            if !unique.contains(&folder) {
                unique.push(folder);
            }
        }
        unique.truncate(MAX_WATCHED_FOLDERS);
        self.watcher.replace_watched(&unique)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domains::folder_watching::application::use_cases::fake_folder_watcher::FakeFolderWatcher;

    fn use_case() -> (UpdateWatchedFolders, Arc<FakeFolderWatcher>) {
        let watcher = Arc::new(FakeFolderWatcher::default());
        (UpdateWatchedFolders::new(watcher.clone()), watcher)
    }

    #[test]
    fn passes_the_folders_to_the_watcher_without_duplicates() {
        let (use_case, watcher) = use_case();

        use_case
            .execute(vec!["/a".into(), "/b".into(), "/a".into()])
            .unwrap();

        assert_eq!(
            *watcher.calls.lock().unwrap(),
            vec![vec![PathBuf::from("/a"), PathBuf::from("/b")]]
        );
    }

    #[test]
    fn limits_how_many_folders_are_watched() {
        let (use_case, watcher) = use_case();
        let folders = (0..MAX_WATCHED_FOLDERS + 10)
            .map(|index| PathBuf::from(format!("/folder-{index}")))
            .collect();

        use_case.execute(folders).unwrap();

        assert_eq!(watcher.calls.lock().unwrap()[0].len(), MAX_WATCHED_FOLDERS);
    }

    #[test]
    fn an_empty_list_stops_all_watching() {
        let (use_case, watcher) = use_case();

        use_case.execute(Vec::new()).unwrap();

        assert_eq!(*watcher.calls.lock().unwrap(), vec![Vec::<PathBuf>::new()]);
    }
}
