use std::path::PathBuf;
use std::sync::Arc;

use tauri::State;

use super::dtos::{CommandErrorDto, DirectoryListingDto};
use crate::domains::directory_browsing::application::ListDirectoryUseCase;

#[tauri::command]
pub fn list_directory(
    use_case: State<'_, Arc<dyn ListDirectoryUseCase>>,
    path: Option<String>,
) -> Result<DirectoryListingDto, CommandErrorDto> {
    use_case
        .execute(path.map(PathBuf::from))
        .map(Into::into)
        .map_err(Into::into)
}
