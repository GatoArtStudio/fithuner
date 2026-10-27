use std::path::Path;
use std::sync::Arc;

use crate::domains::file_preview::application::ports::{PreviewSourcePort, ReadTextPreviewUseCase};
use crate::domains::file_preview::domain::{
    BinaryContentDetector, FilePreviewError, TextDecoder, TextPreview,
};

pub struct ReadTextPreview {
    source: Arc<dyn PreviewSourcePort>,
}

impl ReadTextPreview {
    pub fn new(source: Arc<dyn PreviewSourcePort>) -> Self {
        Self { source }
    }
}

impl ReadTextPreviewUseCase for ReadTextPreview {
    fn execute(
        &self,
        path: &Path,
        max_bytes: u64,
    ) -> Result<Option<TextPreview>, FilePreviewError> {
        let head = self.source.read_head(path, max_bytes)?;
        if BinaryContentDetector::is_binary(&head.bytes) {
            return Ok(None);
        }

        let is_truncated = head.total_bytes > head.bytes.len() as u64;
        Ok(Some(TextPreview {
            content: TextDecoder::decode(&head.bytes, is_truncated),
            is_truncated,
            total_bytes: head.total_bytes,
        }))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domains::file_preview::application::use_cases::fake_preview_source::FakePreviewSource;

    fn preview(content: &[u8], max_bytes: u64) -> Result<Option<TextPreview>, FilePreviewError> {
        ReadTextPreview::new(Arc::new(FakePreviewSource::with_file(content)))
            .execute(Path::new("/file"), max_bytes)
    }

    #[test]
    fn returns_the_whole_text_when_it_fits() {
        let preview = preview(b"hello", 100).unwrap().unwrap();

        assert_eq!(preview.content, "hello");
        assert!(!preview.is_truncated);
        assert_eq!(preview.total_bytes, 5);
    }

    #[test]
    fn truncates_long_text_and_reports_the_real_size() {
        let preview = preview(b"0123456789", 4).unwrap().unwrap();

        assert_eq!(preview.content, "0123");
        assert!(preview.is_truncated);
        assert_eq!(preview.total_bytes, 10);
    }

    #[test]
    fn does_not_leave_half_a_character_at_the_cut() {
        let preview = preview("añb".as_bytes(), 2).unwrap().unwrap();

        assert_eq!(preview.content, "a");
        assert!(preview.is_truncated);
    }

    #[test]
    fn binary_content_has_no_text_preview() {
        assert_eq!(
            preview(&[0x7F, b'E', b'L', b'F', 0, 0, 0], 100).unwrap(),
            None
        );
    }

    #[test]
    fn an_empty_file_is_an_empty_text() {
        let preview = preview(b"", 100).unwrap().unwrap();

        assert_eq!(preview.content, "");
        assert!(!preview.is_truncated);
    }
}
