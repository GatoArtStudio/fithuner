use serde::{Deserialize, Serialize};

use super::PreviewModel;

#[derive(Debug, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct SettingsModel {
    pub schema_version: u32,
    pub appearance: AppearanceModel,
    pub browsing: BrowsingModel,
    pub preview: PreviewModel,
}

#[derive(Debug, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct AppearanceModel {
    pub theme: ThemeModel,
}

#[derive(Debug, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct BrowsingModel {
    pub show_hidden_files: bool,
    pub confirm_before_trash: bool,
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
