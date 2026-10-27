use serde::{Deserialize, Serialize};

use super::preview_settings_dto::PreviewSettingsDto;
use crate::domains::settings::domain::{
    AppSettings, AppearanceSettings, BrowsingSettings, ThemePreference,
};

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ThemePreferenceDto {
    System,
    Light,
    Dark,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppearanceSettingsDto {
    theme: ThemePreferenceDto,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BrowsingSettingsDto {
    show_hidden_files: bool,
    confirm_before_trash: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SettingsDto {
    appearance: AppearanceSettingsDto,
    browsing: BrowsingSettingsDto,
    preview: PreviewSettingsDto,
}

impl From<AppSettings> for SettingsDto {
    fn from(settings: AppSettings) -> Self {
        Self {
            appearance: AppearanceSettingsDto {
                theme: match settings.appearance.theme {
                    ThemePreference::System => ThemePreferenceDto::System,
                    ThemePreference::Light => ThemePreferenceDto::Light,
                    ThemePreference::Dark => ThemePreferenceDto::Dark,
                },
            },
            browsing: BrowsingSettingsDto {
                show_hidden_files: settings.browsing.show_hidden_files,
                confirm_before_trash: settings.browsing.confirm_before_trash,
            },
            preview: settings.preview.into(),
        }
    }
}

impl From<SettingsDto> for AppSettings {
    fn from(dto: SettingsDto) -> Self {
        Self {
            appearance: AppearanceSettings {
                theme: match dto.appearance.theme {
                    ThemePreferenceDto::System => ThemePreference::System,
                    ThemePreferenceDto::Light => ThemePreference::Light,
                    ThemePreferenceDto::Dark => ThemePreference::Dark,
                },
            },
            browsing: BrowsingSettings {
                show_hidden_files: dto.browsing.show_hidden_files,
                confirm_before_trash: dto.browsing.confirm_before_trash,
            },
            preview: dto.preview.into(),
        }
    }
}
