use serde::Serialize;

use crate::domains::settings::domain::SettingsError;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SettingsErrorDto {
    kind: &'static str,
    message: String,
}

impl From<SettingsError> for SettingsErrorDto {
    fn from(error: SettingsError) -> Self {
        Self {
            kind: match error {
                SettingsError::Unavailable(_) => "unavailable",
                SettingsError::Corrupted(_) => "corrupted",
            },
            message: error.to_string(),
        }
    }
}
