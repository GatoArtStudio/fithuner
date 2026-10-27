mod entities;
mod enums;
mod errors;

pub use entities::{
    AppSettings, AppearanceSettings, BrowsingSettings, DEFAULT_PANEL_SIZE_PX,
    PreviewProvidersSettings, PreviewSettings, SizedProviderSettings, ToggleProviderSettings,
};
pub use enums::{PanelPosition, ThemePreference};
pub use errors::SettingsError;
