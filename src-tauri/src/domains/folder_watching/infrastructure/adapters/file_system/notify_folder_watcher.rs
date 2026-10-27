use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};
use std::sync::mpsc::{self, RecvTimeoutError};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, Instant};

use notify::{Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};

use crate::domains::folder_watching::application::FolderWatcherPort;
use crate::domains::folder_watching::domain::{ChangeCoalescer, FolderWatchingError};

const COALESCE_WINDOW: Duration = Duration::from_millis(150);

type ChangeHandler = Arc<dyn Fn(PathBuf) + Send + Sync>;
/// Every spelling a watched folder may be reported under (as given and canonical) mapped to the folder as given.
type WatchedFolders = Arc<Mutex<HashMap<PathBuf, PathBuf>>>;

pub struct NotifyFolderWatcher {
    watcher: Mutex<RecommendedWatcher>,
    watched: WatchedFolders,
}

fn watched_folder_of(path: &Path, watched: &HashMap<PathBuf, PathBuf>) -> Option<PathBuf> {
    watched
        .get(path)
        .or_else(|| path.parent().and_then(|parent| watched.get(parent)))
        .cloned()
}

fn reports_content_change(event: &Event) -> bool {
    !matches!(event.kind, EventKind::Access(_) | EventKind::Other)
}

impl NotifyFolderWatcher {
    pub fn new(on_change: ChangeHandler) -> Result<Self, FolderWatchingError> {
        let (sender, receiver) = mpsc::channel::<PathBuf>();
        let watched: WatchedFolders = Arc::default();

        let watcher = notify::recommended_watcher(move |result: notify::Result<Event>| {
            if let Ok(event) = result
                && reports_content_change(&event)
            {
                for path in event.paths {
                    let _ = sender.send(path);
                }
            }
        })
        .map_err(|error| FolderWatchingError::Unexpected(error.to_string()))?;

        let watched_for_worker = watched.clone();
        thread::spawn(move || {
            let mut coalescer = ChangeCoalescer::new(COALESCE_WINDOW);
            loop {
                let timeout = coalescer
                    .time_until_ready(Instant::now())
                    .unwrap_or(Duration::from_secs(3600));
                match receiver.recv_timeout(timeout) {
                    Ok(path) => {
                        let folder = watched_folder_of(&path, &watched_for_worker.lock().unwrap());
                        if let Some(folder) = folder {
                            coalescer.push(folder, Instant::now());
                        }
                    }
                    Err(RecvTimeoutError::Timeout) => {}
                    Err(RecvTimeoutError::Disconnected) => break,
                }
                for folder in coalescer.take_ready(Instant::now()) {
                    on_change(folder);
                }
            }
        });

        Ok(Self {
            watcher: Mutex::new(watcher),
            watched,
        })
    }
}

impl FolderWatcherPort for NotifyFolderWatcher {
    fn replace_watched(&self, folders: &[PathBuf]) -> Result<(), FolderWatchingError> {
        let mut watcher = self.watcher.lock().unwrap();
        let mut watched = self.watched.lock().unwrap();
        let wanted: HashSet<&PathBuf> = folders.iter().collect();

        let stale: HashSet<PathBuf> = watched
            .values()
            .filter(|folder| !wanted.contains(folder))
            .cloned()
            .collect();
        for folder in &stale {
            let _ = watcher.unwatch(folder);
        }
        watched.retain(|_, folder| !stale.contains(folder));

        for folder in folders {
            if watched.contains_key(folder) {
                continue;
            }
            if watcher.watch(folder, RecursiveMode::NonRecursive).is_ok() {
                watched.insert(folder.clone(), folder.clone());
                if let Ok(canonical) = folder.canonicalize() {
                    watched.insert(canonical, folder.clone());
                }
            } else {
                log::debug!("Could not watch {}", folder.display());
            }
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use std::fs;

    use super::*;

    fn watcher_reporting_to(sender: mpsc::Sender<PathBuf>) -> NotifyFolderWatcher {
        let sender = Mutex::new(sender);
        NotifyFolderWatcher::new(Arc::new(move |folder| {
            let _ = sender.lock().unwrap().send(folder);
        }))
        .unwrap()
    }

    #[test]
    fn reports_the_folder_when_files_appear_in_it() {
        let folder = tempfile::tempdir().unwrap();
        let (sender, receiver) = mpsc::channel();
        let watcher = watcher_reporting_to(sender);
        watcher
            .replace_watched(&[folder.path().to_path_buf()])
            .unwrap();

        for name in ["a.txt", "b.txt", "c.txt"] {
            fs::write(folder.path().join(name), "x").unwrap();
        }

        let reported = receiver.recv_timeout(Duration::from_secs(10)).unwrap();
        assert_eq!(reported, folder.path());
    }

    #[test]
    fn stops_reporting_folders_that_are_no_longer_watched() {
        let folder = tempfile::tempdir().unwrap();
        let (sender, receiver) = mpsc::channel();
        let watcher = watcher_reporting_to(sender);
        watcher
            .replace_watched(&[folder.path().to_path_buf()])
            .unwrap();
        watcher.replace_watched(&[]).unwrap();

        fs::write(folder.path().join("a.txt"), "x").unwrap();

        assert!(receiver.recv_timeout(Duration::from_millis(700)).is_err());
    }

    #[test]
    fn skips_folders_that_do_not_exist() {
        let (sender, _receiver) = mpsc::channel();
        let watcher = watcher_reporting_to(sender);

        assert!(
            watcher
                .replace_watched(&[PathBuf::from("/definitely/not/here")])
                .is_ok()
        );
    }
}
