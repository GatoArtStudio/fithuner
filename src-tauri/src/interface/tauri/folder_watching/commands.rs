use std::path::PathBuf;
use std::sync::Arc;

use tauri::State;

use crate::domains::folder_watching::application::UpdateWatchedFoldersUseCase;

pub const FOLDER_CHANGED_EVENT: &str = "folder-changed";

#[tauri::command]
pub fn watch_folders(
    use_case: State<'_, Arc<dyn UpdateWatchedFoldersUseCase>>,
    paths: Vec<String>,
) -> Result<(), String> {
    use_case
        .execute(paths.into_iter().map(PathBuf::from).collect())
        .map_err(|error| error.to_string())
}
