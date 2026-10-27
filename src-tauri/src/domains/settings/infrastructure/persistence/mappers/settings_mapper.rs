use super::preview_mapper::{preview_to_domain, preview_to_model};
use crate::domains::settings::domain::{
    AppSettings, AppearanceSettings, BrowsingSettings, ThemePreference, UpdateSettings,
};
use crate::domains::settings::infrastructure::persistence::models::{
    AppearanceModel, BrowsingModel, SettingsModel, ThemeModel, UpdatesModel,
};

pub const CURRENT_SCHEMA_VERSION: u32 = 1;

pub fn to_model(settings: &AppSettings) -> SettingsModel {
    SettingsModel {
        schema_version: CURRENT_SCHEMA_VERSION,
        appearance: AppearanceModel {
            theme: match settings.appearance.theme {
                ThemePreference::System => ThemeModel::System,
                ThemePreference::Light => ThemeModel::Light,
                ThemePreference::Dark => ThemeModel::Dark,
            },
        },
        browsing: BrowsingModel {
            show_hidden_files: settings.browsing.show_hidden_files,
            confirm_before_trash: settings.browsing.confirm_before_trash,
        },
        preview: preview_to_model(&settings.preview),
        updates: UpdatesModel {
            check_on_startup: settings.updates.check_on_startup,
            auto_download: settings.updates.auto_download,
        },
    }
}

pub fn to_domain(model: SettingsModel) -> AppSettings {
    AppSettings {
        appearance: AppearanceSettings {
            theme: match model.appearance.theme {
                ThemeModel::System => ThemePreference::System,
                ThemeModel::Light => ThemePreference::Light,
                ThemeModel::Dark => ThemePreference::Dark,
            },
        },
        browsing: BrowsingSettings {
            show_hidden_files: model.browsing.show_hidden_files,
            confirm_before_trash: model.browsing.confirm_before_trash,
        },
        preview: preview_to_domain(model.preview),
        updates: UpdateSettings {
            check_on_startup: model.updates.check_on_startup,
            auto_download: model.updates.auto_download,
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domains::settings::domain::PreviewSettings;

    #[test]
    fn round_trips_every_setting() {
        let settings = AppSettings {
            appearance: AppearanceSettings {
                theme: ThemePreference::Dark,
            },
            browsing: BrowsingSettings {
                show_hidden_files: true,
                confirm_before_trash: true,
            },
            preview: PreviewSettings {
                quick_look_enabled: false,
                ..PreviewSettings::default()
            },
            updates: UpdateSettings {
                check_on_startup: false,
                auto_download: true,
            },
        };

        assert_eq!(to_domain(to_model(&settings)), settings);
    }

    #[test]
    fn an_empty_model_maps_to_the_default_settings() {
        assert_eq!(to_domain(SettingsModel::default()), AppSettings::default());
    }

    #[test]
    fn stamps_the_current_schema_version() {
        assert_eq!(
            to_model(&AppSettings::default()).schema_version,
            CURRENT_SCHEMA_VERSION
        );
    }
}
