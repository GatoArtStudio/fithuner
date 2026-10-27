mod app_settings;
mod appearance_settings;
mod browsing_settings;
mod preview_providers_settings;
mod preview_settings;
mod sized_provider_settings;
mod toggle_provider_settings;
mod update_settings;

pub use app_settings::AppSettings;
pub use appearance_settings::AppearanceSettings;
pub use browsing_settings::BrowsingSettings;
pub use preview_providers_settings::PreviewProvidersSettings;
pub use preview_settings::{DEFAULT_PANEL_SIZE_PX, PreviewSettings};
pub use sized_provider_settings::SizedProviderSettings;
pub use toggle_provider_settings::ToggleProviderSettings;
pub use update_settings::UpdateSettings;
