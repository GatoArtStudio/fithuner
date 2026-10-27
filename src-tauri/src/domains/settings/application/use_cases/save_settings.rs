use std::sync::Arc;

use crate::domains::settings::application::ports::{SaveSettingsUseCase, SettingsRepositoryPort};
use crate::domains::settings::domain::{AppSettings, SettingsError};

pub struct SaveSettings {
    repository: Arc<dyn SettingsRepositoryPort>,
}

impl SaveSettings {
    pub fn new(repository: Arc<dyn SettingsRepositoryPort>) -> Self {
        Self { repository }
    }
}

impl SaveSettingsUseCase for SaveSettings {
    fn execute(&self, settings: AppSettings) -> Result<AppSettings, SettingsError> {
        self.repository.save(&settings)?;
        Ok(settings)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domains::settings::application::use_cases::fake_settings_repository::FakeSettingsRepository;

    #[test]
    fn persists_and_returns_the_saved_settings() {
        let repository = Arc::new(FakeSettingsRepository::holding(Ok(None)));
        let mut settings = AppSettings::default();
        settings.browsing.show_hidden_files = true;

        let saved = SaveSettings::new(repository.clone())
            .execute(settings.clone())
            .unwrap();

        assert_eq!(saved, settings);
        assert_eq!(repository.stored_settings(), Some(settings));
    }

    #[test]
    fn propagates_repository_failures() {
        let repository =
            FakeSettingsRepository::failing_to_save(SettingsError::Unavailable("disk full".into()));

        let error = SaveSettings::new(Arc::new(repository))
            .execute(AppSettings::default())
            .unwrap_err();

        assert_eq!(error, SettingsError::Unavailable("disk full".into()));
    }
}
