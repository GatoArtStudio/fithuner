use std::path::PathBuf;
use std::sync::Arc;

use tauri::State;

use super::dtos::{FilePreviewErrorDto, FolderSummaryDto, TextPreviewDto};
use crate::domains::file_preview::application::{ReadTextPreviewUseCase, SummarizeFolderUseCase};

#[tauri::command(async)]
pub fn read_text_preview(
    use_case: State<'_, Arc<dyn ReadTextPreviewUseCase>>,
    path: String,
    max_bytes: u64,
) -> Result<Option<TextPreviewDto>, FilePreviewErrorDto> {
    use_case
        .execute(&PathBuf::from(path), max_bytes)
        .map(|preview| preview.map(Into::into))
        .map_err(Into::into)
}

#[tauri::command(async)]
pub fn summarize_folder(
    use_case: State<'_, Arc<dyn SummarizeFolderUseCase>>,
    path: String,
) -> Result<FolderSummaryDto, FilePreviewErrorDto> {
    use_case
        .execute(&PathBuf::from(path))
        .map(Into::into)
        .map_err(Into::into)
}
