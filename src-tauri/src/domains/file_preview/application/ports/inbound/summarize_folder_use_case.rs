use std::path::Path;

use crate::domains::file_preview::domain::{FilePreviewError, FolderSummary};

pub trait SummarizeFolderUseCase: Send + Sync {
    fn execute(&self, path: &Path) -> Result<FolderSummary, FilePreviewError>;
}
