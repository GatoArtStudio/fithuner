use std::path::PathBuf;
use std::sync::Arc;

use tauri::State;

use super::dtos::{ClipboardErrorDto, ClipboardFilesDto, ClipboardIntentDto};
use crate::domains::file_clipboard::application::{
    ClearCutMarkerUseCase, PlaceFilesOnClipboardUseCase, ReadClipboardFilesUseCase,
};

#[tauri::command]
pub fn copy_files_to_clipboard(
    use_case: State<'_, Arc<dyn PlaceFilesOnClipboardUseCase>>,
    paths: Vec<String>,
    intent: ClipboardIntentDto,
) -> Result<(), ClipboardErrorDto> {
    use_case
        .execute(
            paths.into_iter().map(PathBuf::from).collect(),
            intent.into(),
        )
        .map_err(Into::into)
}

#[tauri::command]
pub fn read_clipboard_files(
    use_case: State<'_, Arc<dyn ReadClipboardFilesUseCase>>,
) -> Result<ClipboardFilesDto, ClipboardErrorDto> {
    use_case.execute().map(Into::into).map_err(Into::into)
}

#[tauri::command]
pub fn clear_cut_marker(use_case: State<'_, Arc<dyn ClearCutMarkerUseCase>>) {
    use_case.execute();
}
