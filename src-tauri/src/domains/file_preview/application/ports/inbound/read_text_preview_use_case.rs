use std::path::Path;

use crate::domains::file_preview::domain::{FilePreviewError, TextPreview};

pub trait ReadTextPreviewUseCase: Send + Sync {
    /// Returns `None` when the file does not look like text.
    fn execute(&self, path: &Path, max_bytes: u64)
    -> Result<Option<TextPreview>, FilePreviewError>;
}
