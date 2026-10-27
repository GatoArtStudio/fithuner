use crate::domains::settings::domain::{PanelPosition, PreviewProvidersSettings};

pub const DEFAULT_PANEL_SIZE_PX: u32 = 340;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PreviewSettings {
    pub panel_enabled: bool,
    pub show_panel: bool,
    pub panel_position: PanelPosition,
    pub panel_size_px: u32,
    pub quick_look_enabled: bool,
    pub providers: PreviewProvidersSettings,
}

impl Default for PreviewSettings {
    fn default() -> Self {
        Self {
            panel_enabled: true,
            show_panel: true,
            panel_position: PanelPosition::default(),
            panel_size_px: DEFAULT_PANEL_SIZE_PX,
            quick_look_enabled: true,
            providers: PreviewProvidersSettings::default(),
        }
    }
}
