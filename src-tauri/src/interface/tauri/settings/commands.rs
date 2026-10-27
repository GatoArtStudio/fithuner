use std::sync::Arc;

use tauri::State;

use super::dtos::{SettingsDto, SettingsErrorDto};
use crate::domains::settings::application::{LoadSettingsUseCase, SaveSettingsUseCase};

#[tauri::command]
pub fn load_settings(use_case: State<'_, Arc<dyn LoadSettingsUseCase>>) -> SettingsDto {
    use_case.execute().into()
}

#[tauri::command]
pub fn save_settings(
    use_case: State<'_, Arc<dyn SaveSettingsUseCase>>,
    settings: SettingsDto,
) -> Result<SettingsDto, SettingsErrorDto> {
    use_case
        .execute(settings.into())
        .map(Into::into)
        .map_err(Into::into)
}
