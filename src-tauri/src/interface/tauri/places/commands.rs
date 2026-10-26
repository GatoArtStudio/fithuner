use std::sync::Arc;

use tauri::State;

use super::dtos::PlaceDto;
use crate::domains::places::application::ListPlacesUseCase;

#[tauri::command]
pub fn list_places(use_case: State<'_, Arc<dyn ListPlacesUseCase>>) -> Vec<PlaceDto> {
    use_case.execute().into_iter().map(Into::into).collect()
}
