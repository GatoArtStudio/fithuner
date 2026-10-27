use std::path::PathBuf;

use crate::domains::file_clipboard::domain::ClipboardIntent;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ClipboardFiles {
    pub paths: Vec<PathBuf>,
    pub intent: ClipboardIntent,
}
