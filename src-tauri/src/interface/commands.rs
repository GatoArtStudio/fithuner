use std::path::PathBuf;

use tauri::State;

use super::dto::{CommandErrorDto, DirectoryListingDto, PlaceDto};
use crate::application::{ListDirectory, ListPlaces};

pub struct AppUseCases {
    pub list_directory: ListDirectory,
    pub list_places: ListPlaces,
}

#[tauri::command]
pub fn list_directory(
    use_cases: State<'_, AppUseCases>,
    path: Option<String>,
) -> Result<DirectoryListingDto, CommandErrorDto> {
    use_cases
        .list_directory
        .execute(path.map(PathBuf::from))
        .map(Into::into)
        .map_err(Into::into)
}

#[tauri::command]
pub fn list_places(use_cases: State<'_, AppUseCases>) -> Vec<PlaceDto> {
    use_cases
        .list_places
        .execute()
        .into_iter()
        .map(Into::into)
        .collect()
}
