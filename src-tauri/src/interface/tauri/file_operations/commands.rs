use std::path::PathBuf;
use std::sync::Arc;

use tauri::State;

use super::dtos::{BatchOutcomeDto, EntryMoveDto, FileOperationErrorDto, NewEntryKindDto};
use crate::domains::file_operations::application::{
    CreateEntryUseCase, DeleteEntriesPermanentlyUseCase, MoveEntriesUseCase, OpenEntryUseCase,
    RenameEntryUseCase, RestoreEntriesUseCase, TrashEntriesUseCase,
};

fn path_to_string(path: PathBuf) -> String {
    path.to_string_lossy().into_owned()
}

#[tauri::command]
pub fn open_entry(
    use_case: State<'_, Arc<dyn OpenEntryUseCase>>,
    path: String,
) -> Result<(), FileOperationErrorDto> {
    use_case.execute(&PathBuf::from(path)).map_err(Into::into)
}

#[tauri::command]
pub fn create_entry(
    use_case: State<'_, Arc<dyn CreateEntryUseCase>>,
    parent_path: String,
    kind: NewEntryKindDto,
) -> Result<String, FileOperationErrorDto> {
    use_case
        .execute(&PathBuf::from(parent_path), kind.into())
        .map(path_to_string)
        .map_err(Into::into)
}

#[tauri::command]
pub fn rename_entry(
    use_case: State<'_, Arc<dyn RenameEntryUseCase>>,
    path: String,
    new_name: String,
) -> Result<String, FileOperationErrorDto> {
    use_case
        .execute(&PathBuf::from(path), &new_name)
        .map(path_to_string)
        .map_err(Into::into)
}

#[tauri::command]
pub fn trash_entries(
    use_case: State<'_, Arc<dyn TrashEntriesUseCase>>,
    paths: Vec<String>,
) -> BatchOutcomeDto {
    use_case
        .execute(paths.into_iter().map(PathBuf::from).collect())
        .into()
}

#[tauri::command]
pub fn delete_entries_permanently(
    use_case: State<'_, Arc<dyn DeleteEntriesPermanentlyUseCase>>,
    paths: Vec<String>,
) -> BatchOutcomeDto {
    use_case
        .execute(paths.into_iter().map(PathBuf::from).collect())
        .into()
}

#[tauri::command]
pub fn move_entries(
    use_case: State<'_, Arc<dyn MoveEntriesUseCase>>,
    moves: Vec<EntryMoveDto>,
) -> BatchOutcomeDto {
    use_case
        .execute(moves.into_iter().map(Into::into).collect())
        .into()
}

#[tauri::command]
pub fn restore_entries(
    use_case: State<'_, Arc<dyn RestoreEntriesUseCase>>,
    paths: Vec<String>,
) -> BatchOutcomeDto {
    use_case
        .execute(paths.into_iter().map(PathBuf::from).collect())
        .into()
}
