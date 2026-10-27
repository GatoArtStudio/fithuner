use serde::{Deserialize, Serialize};

use super::{PreviewModel, UpdatesModel};

#[derive(Debug, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct SettingsModel {
    pub schema_version: u32,
    pub appearance: AppearanceModel,
    pub browsing: BrowsingModel,
    pub preview: PreviewModel,
    pub updates: UpdatesModel,
}

#[derive(Debug, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct AppearanceModel {
    pub theme: ThemeModel,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct BrowsingModel {
    pub show_hidden_files: bool,
    pub confirm_before_trash: bool,
    pub restore_tabs_on_startup: bool,
    pub watch_folders: bool,
}

impl Default for BrowsingModel {
    fn default() -> Self {
        Self {
            show_hidden_files: false,
            confirm_before_trash: false,
            restore_tabs_on_startup: true,
            watch_folders: true,
        }
    }
}

#[derive(Debug, Default, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ThemeModel {
    Light,
    Dark,
    #[default]
    #[serde(other)]
    System,
}
