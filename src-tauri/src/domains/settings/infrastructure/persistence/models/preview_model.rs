use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct PreviewModel {
    pub panel_enabled: bool,
    pub show_panel: bool,
    pub panel_position: PanelPositionModel,
    pub panel_size_px: Option<u32>,
    pub quick_look_enabled: bool,
    pub providers: PreviewProvidersModel,
}

impl Default for PreviewModel {
    fn default() -> Self {
        Self {
            panel_enabled: true,
            show_panel: true,
            panel_position: PanelPositionModel::default(),
            panel_size_px: None,
            quick_look_enabled: true,
            providers: PreviewProvidersModel::default(),
        }
    }
}

#[derive(Debug, Default, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum PanelPositionModel {
    Bottom,
    #[default]
    #[serde(other)]
    Right,
}

#[derive(Debug, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct PreviewProvidersModel {
    pub image: SizedProviderModel,
    pub text: SizedProviderModel,
    pub markdown: SizedProviderModel,
    pub json: SizedProviderModel,
    pub csv: SizedProviderModel,
    pub pdf: SizedProviderModel,
    pub audio: ToggleProviderModel,
    pub video: ToggleProviderModel,
    pub folder: ToggleProviderModel,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct SizedProviderModel {
    pub enabled: bool,
    pub max_size_megabytes: Option<u32>,
}

impl Default for SizedProviderModel {
    fn default() -> Self {
        Self {
            enabled: true,
            max_size_megabytes: None,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct ToggleProviderModel {
    pub enabled: bool,
}

impl Default for ToggleProviderModel {
    fn default() -> Self {
        Self { enabled: true }
    }
}
