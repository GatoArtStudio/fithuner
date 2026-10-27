use serde::Serialize;

use crate::domains::file_preview::domain::{FilePreviewError, FolderSummary, TextPreview};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TextPreviewDto {
    content: String,
    is_truncated: bool,
    total_bytes: u64,
}

impl From<TextPreview> for TextPreviewDto {
    fn from(preview: TextPreview) -> Self {
        Self {
            content: preview.content,
            is_truncated: preview.is_truncated,
            total_bytes: preview.total_bytes,
        }
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FolderSummaryDto {
    file_count: u64,
    folder_count: u64,
    total_bytes: u64,
    is_partial: bool,
}

impl From<FolderSummary> for FolderSummaryDto {
    fn from(summary: FolderSummary) -> Self {
        Self {
            file_count: summary.file_count,
            folder_count: summary.folder_count,
            total_bytes: summary.total_bytes,
            is_partial: summary.is_partial,
        }
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FilePreviewErrorDto {
    kind: &'static str,
    message: String,
}

impl From<FilePreviewError> for FilePreviewErrorDto {
    fn from(error: FilePreviewError) -> Self {
        Self {
            kind: match error {
                FilePreviewError::NotFound => "notFound",
                FilePreviewError::PermissionDenied => "permissionDenied",
                FilePreviewError::NotAFile => "notAFile",
                FilePreviewError::NotADirectory => "notADirectory",
                FilePreviewError::Unexpected(_) => "unexpected",
            },
            message: error.to_string(),
        }
    }
}
