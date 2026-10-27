use std::path::PathBuf;
use std::sync::Mutex;

use crate::domains::file_clipboard::application::ports::{CutMarkerPort, SystemClipboardPort};
use crate::domains::file_clipboard::domain::ClipboardError;

#[derive(Default)]
pub struct FakeClipboard {
    files: Mutex<Vec<PathBuf>>,
}

impl FakeClipboard {
    pub fn replace_with_foreign_files(&self, paths: &[&str]) {
        *self.files.lock().unwrap() = paths.iter().map(PathBuf::from).collect();
    }
}

impl SystemClipboardPort for FakeClipboard {
    fn write_files(&self, paths: &[PathBuf]) -> Result<(), ClipboardError> {
        *self.files.lock().unwrap() = paths.to_vec();
        Ok(())
    }

    fn read_files(&self) -> Result<Vec<PathBuf>, ClipboardError> {
        Ok(self.files.lock().unwrap().clone())
    }
}

#[derive(Default)]
pub struct FakeCutMarker {
    paths: Mutex<Vec<PathBuf>>,
}

impl CutMarkerPort for FakeCutMarker {
    fn mark_as_cut(&self, paths: &[PathBuf]) {
        *self.paths.lock().unwrap() = paths.to_vec();
    }

    fn marked_paths(&self) -> Vec<PathBuf> {
        self.paths.lock().unwrap().clone()
    }

    fn clear(&self) {
        self.paths.lock().unwrap().clear();
    }
}
