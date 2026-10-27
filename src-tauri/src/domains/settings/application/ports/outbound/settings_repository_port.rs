use crate::domains::settings::domain::{AppSettings, SettingsError};

pub trait SettingsRepositoryPort: Send + Sync {
    fn load(&self) -> Result<Option<AppSettings>, SettingsError>;
    fn save(&self, settings: &AppSettings) -> Result<(), SettingsError>;
}
