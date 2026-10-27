use crate::domains::settings::domain::{AppSettings, SettingsError};

pub trait SaveSettingsUseCase: Send + Sync {
    fn execute(&self, settings: AppSettings) -> Result<AppSettings, SettingsError>;
}
