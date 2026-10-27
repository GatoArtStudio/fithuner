use std::path::Path;
use std::sync::Arc;

use crate::domains::file_preview::application::ports::{PreviewSourcePort, SummarizeFolderUseCase};
use crate::domains::file_preview::domain::{FilePreviewError, FolderSummary, FolderWalkLimits};

pub struct SummarizeFolder {
    source: Arc<dyn PreviewSourcePort>,
}

impl SummarizeFolder {
    pub fn new(source: Arc<dyn PreviewSourcePort>) -> Self {
        Self { source }
    }
}

impl SummarizeFolderUseCase for SummarizeFolder {
    fn execute(&self, path: &Path) -> Result<FolderSummary, FilePreviewError> {
        self.source.walk_folder(path, &FolderWalkLimits::default())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domains::file_preview::application::use_cases::fake_preview_source::FakePreviewSource;

    #[test]
    fn returns_the_summary_computed_with_the_default_limits() {
        let summary = FolderSummary {
            file_count: 3,
            folder_count: 1,
            total_bytes: 42,
            is_partial: false,
        };
        let source = Arc::new(FakePreviewSource::with_folder(summary));

        let result = SummarizeFolder::new(source.clone())
            .execute(Path::new("/folder"))
            .unwrap();

        assert_eq!(result, summary);
        assert_eq!(
            *source.requested_limits.lock().unwrap(),
            vec![FolderWalkLimits::default()]
        );
    }
}
