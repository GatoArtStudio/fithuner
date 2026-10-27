use std::path::Path;

use crate::domains::file_preview::domain::{
    FileHead, FilePreviewError, FolderSummary, FolderWalkLimits,
};

pub trait PreviewSourcePort: Send + Sync {
    fn read_head(&self, path: &Path, limit_bytes: u64) -> Result<FileHead, FilePreviewError>;
    fn walk_folder(
        &self,
        path: &Path,
        limits: &FolderWalkLimits,
    ) -> Result<FolderSummary, FilePreviewError>;
}
