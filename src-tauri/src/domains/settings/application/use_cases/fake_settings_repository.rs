use std::sync::Mutex;

use crate::domains::settings::application::ports::SettingsRepositoryPort;
use crate::domains::settings::domain::{AppSettings, SettingsError};

pub struct FakeSettingsRepository {
    stored: Mutex<Result<Option<AppSettings>, SettingsError>>,
    save_error: Option<SettingsError>,
}

impl FakeSettingsRepository {
    pub fn holding(stored: Result<Option<AppSettings>, SettingsError>) -> Self {
        Self {
            stored: Mutex::new(stored),
            save_error: None,
        }
    }

    pub fn failing_to_save(error: SettingsError) -> Self {
        Self {
            stored: Mutex::new(Ok(None)),
            save_error: Some(error),
        }
    }

    pub fn stored_settings(&self) -> Option<AppSettings> {
        self.stored.lock().unwrap().clone().ok().flatten()
    }
}

impl SettingsRepositoryPort for FakeSettingsRepository {
    fn load(&self) -> Result<Option<AppSettings>, SettingsError> {
        self.stored.lock().unwrap().clone()
    }

    fn save(&self, settings: &AppSettings) -> Result<(), SettingsError> {
        if let Some(error) = &self.save_error {
            return Err(error.clone());
        }
        *self.stored.lock().unwrap() = Ok(Some(settings.clone()));
        Ok(())
    }
}
