use std::path::Path;
use std::sync::Mutex;

use crate::domains::file_preview::application::ports::PreviewSourcePort;
use crate::domains::file_preview::domain::{
    FileHead, FilePreviewError, FolderSummary, FolderWalkLimits,
};

pub struct FakePreviewSource {
    content: Vec<u8>,
    folder: FolderSummary,
    pub requested_limits: Mutex<Vec<FolderWalkLimits>>,
}

impl FakePreviewSource {
    pub fn with_file(content: &[u8]) -> Self {
        Self {
            content: content.to_vec(),
            folder: FolderSummary::default(),
            requested_limits: Mutex::default(),
        }
    }

    pub fn with_folder(folder: FolderSummary) -> Self {
        Self {
            content: Vec::new(),
            folder,
            requested_limits: Mutex::default(),
        }
    }
}

impl PreviewSourcePort for FakePreviewSource {
    fn read_head(&self, _path: &Path, limit_bytes: u64) -> Result<FileHead, FilePreviewError> {
        let length = self.content.len().min(limit_bytes as usize);
        Ok(FileHead {
            bytes: self.content[..length].to_vec(),
            total_bytes: self.content.len() as u64,
        })
    }

    fn walk_folder(
        &self,
        _path: &Path,
        limits: &FolderWalkLimits,
    ) -> Result<FolderSummary, FilePreviewError> {
        self.requested_limits.lock().unwrap().push(*limits);
        Ok(self.folder)
    }
}
