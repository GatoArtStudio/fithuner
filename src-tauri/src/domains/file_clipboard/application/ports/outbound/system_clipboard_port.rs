use std::path::{Path, PathBuf};

use crate::domains::file_clipboard::domain::ClipboardError;

pub trait SystemClipboardPort: Send + Sync {
    fn write_files(&self, paths: &[PathBuf]) -> Result<(), ClipboardError>;
    fn read_files(&self) -> Result<Vec<PathBuf>, ClipboardError>;
}

pub fn contains_same_paths(first: &[PathBuf], second: &[PathBuf]) -> bool {
    first.len() == second.len()
        && first
            .iter()
            .all(|path| second.iter().any(|other| other == path as &Path))
}
