use std::path::PathBuf;
use std::sync::Mutex;

use crate::domains::file_clipboard::application::CutMarkerPort;

#[derive(Default)]
pub struct InMemoryCutMarker {
    paths: Mutex<Vec<PathBuf>>,
}

impl CutMarkerPort for InMemoryCutMarker {
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
