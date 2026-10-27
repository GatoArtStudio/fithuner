use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};

use crate::domains::folder_search::application::ports::FolderWalkerPort;
use crate::domains::folder_search::domain::{
    EntryKind, FolderSearchError, WalkControl, WalkedEntry,
};

pub struct FakeFolderWalker {
    entries: Vec<WalkedEntry>,
    error: Option<FolderSearchError>,
    pub requested_hidden: Arc<Mutex<Vec<bool>>>,
}

impl FakeFolderWalker {
    pub fn with(entries: &[(&str, EntryKind)]) -> Self {
        Self::from_owned(
            entries
                .iter()
                .map(|(path, kind)| (path.to_string(), *kind))
                .collect(),
        )
    }

    pub fn from_owned(entries: Vec<(String, EntryKind)>) -> Self {
        Self {
            entries: entries
                .into_iter()
                .map(|(path, kind)| {
                    let path = PathBuf::from(path);
                    WalkedEntry {
                        name: path.file_name().unwrap().to_string_lossy().into_owned(),
                        path,
                        kind,
                        size_in_bytes: 1,
                        modified_at_millis: None,
                    }
                })
                .collect(),
            error: None,
            requested_hidden: Arc::default(),
        }
    }

    pub fn failing(error: FolderSearchError) -> Self {
        Self {
            entries: Vec::new(),
            error: Some(error),
            requested_hidden: Arc::default(),
        }
    }
}

impl FolderWalkerPort for FakeFolderWalker {
    fn walk(
        &self,
        _root: &Path,
        include_hidden: bool,
        visitor: &mut dyn FnMut(WalkedEntry) -> WalkControl,
    ) -> Result<(), FolderSearchError> {
        self.requested_hidden.lock().unwrap().push(include_hidden);
        if let Some(error) = &self.error {
            return Err(error.clone());
        }
        for entry in &self.entries {
            if visitor(entry.clone()) == WalkControl::Stop {
                break;
            }
        }
        Ok(())
    }
}
