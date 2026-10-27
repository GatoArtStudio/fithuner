use std::sync::Arc;

use crate::domains::settings::application::ports::{LoadSettingsUseCase, SettingsRepositoryPort};
use crate::domains::settings::domain::AppSettings;

pub struct LoadSettings {
    repository: Arc<dyn SettingsRepositoryPort>,
}

impl LoadSettings {
    pub fn new(repository: Arc<dyn SettingsRepositoryPort>) -> Self {
        Self { repository }
    }
}

impl LoadSettingsUseCase for LoadSettings {
    fn execute(&self) -> AppSettings {
        match self.repository.load() {
            Ok(Some(settings)) => settings,
            Ok(None) => AppSettings::default(),
            Err(error) => {
                eprintln!("Using default settings: {error}");
                AppSettings::default()
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domains::settings::application::use_cases::fake_settings_repository::FakeSettingsRepository;
    use crate::domains::settings::domain::{SettingsError, ThemePreference};

    fn dark_settings() -> AppSettings {
        let mut settings = AppSettings::default();
        settings.appearance.theme = ThemePreference::Dark;
        settings
    }

    #[test]
    fn returns_the_stored_settings() {
        let repository = FakeSettingsRepository::holding(Ok(Some(dark_settings())));

        assert_eq!(
            LoadSettings::new(Arc::new(repository)).execute(),
            dark_settings()
        );
    }

    #[test]
    fn returns_defaults_when_nothing_is_stored() {
        let repository = FakeSettingsRepository::holding(Ok(None));

        assert_eq!(
            LoadSettings::new(Arc::new(repository)).execute(),
            AppSettings::default()
        );
    }

    #[test]
    fn returns_defaults_instead_of_failing_when_the_file_is_corrupted() {
        let repository =
            FakeSettingsRepository::holding(Err(SettingsError::Corrupted("bad json".into())));

        assert_eq!(
            LoadSettings::new(Arc::new(repository)).execute(),
            AppSettings::default()
        );
    }
}
