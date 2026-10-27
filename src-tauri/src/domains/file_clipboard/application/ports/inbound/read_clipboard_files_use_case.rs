use crate::domains::file_clipboard::domain::{ClipboardError, ClipboardFiles};

pub trait ReadClipboardFilesUseCase: Send + Sync {
    fn execute(&self) -> Result<ClipboardFiles, ClipboardError>;
}
