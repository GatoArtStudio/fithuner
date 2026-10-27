use std::path::PathBuf;

use crate::domains::file_clipboard::domain::{ClipboardError, ClipboardIntent};

pub trait PlaceFilesOnClipboardUseCase: Send + Sync {
    fn execute(&self, paths: Vec<PathBuf>, intent: ClipboardIntent) -> Result<(), ClipboardError>;
}
