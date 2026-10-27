use std::fs;
use std::io;
use std::path::PathBuf;

use crate::domains::settings::application::SettingsRepositoryPort;
use crate::domains::settings::domain::{AppSettings, SettingsError};
use crate::domains::settings::infrastructure::persistence::mappers::{to_domain, to_model};
use crate::domains::settings::infrastructure::persistence::models::SettingsModel;

pub struct JsonSettingsRepository {
    file_path: PathBuf,
}

impl JsonSettingsRepository {
    pub fn new(file_path: PathBuf) -> Self {
        Self { file_path }
    }

    fn temporary_path(&self) -> PathBuf {
        let mut name = self
            .file_path
            .file_name()
            .unwrap_or_default()
            .to_os_string();
        name.push(".tmp");
        self.file_path.with_file_name(name)
    }
}

impl SettingsRepositoryPort for JsonSettingsRepository {
    fn load(&self) -> Result<Option<AppSettings>, SettingsError> {
        let content = match fs::read_to_string(&self.file_path) {
            Ok(content) => content,
            Err(error) if error.kind() == io::ErrorKind::NotFound => return Ok(None),
            Err(error) => return Err(SettingsError::Unavailable(error.to_string())),
        };

        serde_json::from_str::<SettingsModel>(&content)
            .map(|model| Some(to_domain(model)))
            .map_err(|error| SettingsError::Corrupted(error.to_string()))
    }

    fn save(&self, settings: &AppSettings) -> Result<(), SettingsError> {
        let unavailable = |error: io::Error| SettingsError::Unavailable(error.to_string());
        if let Some(parent) = self.file_path.parent() {
            fs::create_dir_all(parent).map_err(unavailable)?;
        }

        let content = serde_json::to_string_pretty(&to_model(settings))
            .map_err(|error| SettingsError::Unavailable(error.to_string()))?;
        let temporary_path = self.temporary_path();
        let result = fs::write(&temporary_path, content)
            .and_then(|()| fs::rename(&temporary_path, &self.file_path));

        if result.is_err() {
            let _ = fs::remove_file(&temporary_path);
        }
        result.map_err(unavailable)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domains::settings::domain::ThemePreference;

    fn repository_in(directory: &tempfile::TempDir) -> JsonSettingsRepository {
        JsonSettingsRepository::new(directory.path().join("fithuner").join("settings.json"))
    }

    #[test]
    fn returns_nothing_when_the_file_does_not_exist() {
        let directory = tempfile::tempdir().unwrap();

        assert_eq!(repository_in(&directory).load().unwrap(), None);
    }

    #[test]
    fn saves_and_loads_settings_creating_the_folder() {
        let directory = tempfile::tempdir().unwrap();
        let repository = repository_in(&directory);
        let mut settings = AppSettings::default();
        settings.appearance.theme = ThemePreference::Light;
        settings.browsing.show_hidden_files = true;

        repository.save(&settings).unwrap();

        assert_eq!(repository.load().unwrap(), Some(settings));
    }

    #[test]
    fn leaves_no_temporary_file_after_saving() {
        let directory = tempfile::tempdir().unwrap();
        let repository = repository_in(&directory);

        repository.save(&AppSettings::default()).unwrap();

        let names: Vec<String> = fs::read_dir(directory.path().join("fithuner"))
            .unwrap()
            .filter_map(Result::ok)
            .map(|entry| entry.file_name().to_string_lossy().into_owned())
            .collect();
        assert_eq!(names, vec!["settings.json".to_string()]);
    }

    #[test]
    fn fills_missing_fields_with_defaults_and_ignores_unknown_ones() {
        let directory = tempfile::tempdir().unwrap();
        let repository = repository_in(&directory);
        fs::create_dir_all(directory.path().join("fithuner")).unwrap();
        fs::write(
            directory.path().join("fithuner").join("settings.json"),
            r#"{ "schemaVersion": 1, "browsing": { "showHiddenFiles": true }, "futureFeature": 42 }"#,
        )
        .unwrap();

        let settings = repository.load().unwrap().unwrap();

        assert!(settings.browsing.show_hidden_files);
        assert!(!settings.browsing.confirm_before_trash);
        assert_eq!(settings.appearance.theme, ThemePreference::System);
    }

    #[test]
    fn falls_back_to_the_system_theme_for_unknown_theme_names() {
        let directory = tempfile::tempdir().unwrap();
        let repository = repository_in(&directory);
        fs::create_dir_all(directory.path().join("fithuner")).unwrap();
        fs::write(
            directory.path().join("fithuner").join("settings.json"),
            r#"{ "appearance": { "theme": "sepia" } }"#,
        )
        .unwrap();

        let settings = repository.load().unwrap().unwrap();

        assert_eq!(settings.appearance.theme, ThemePreference::System);
    }

    #[test]
    fn reports_a_corrupted_file() {
        let directory = tempfile::tempdir().unwrap();
        let repository = repository_in(&directory);
        fs::create_dir_all(directory.path().join("fithuner")).unwrap();
        fs::write(
            directory.path().join("fithuner").join("settings.json"),
            "{ not json",
        )
        .unwrap();

        assert!(matches!(
            repository.load(),
            Err(SettingsError::Corrupted(_))
        ));
    }
}
