use crate::domains::settings::domain::{SizedProviderSettings, ToggleProviderSettings};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PreviewProvidersSettings {
    pub image: SizedProviderSettings,
    pub text: SizedProviderSettings,
    pub markdown: SizedProviderSettings,
    pub json: SizedProviderSettings,
    pub csv: SizedProviderSettings,
    pub pdf: SizedProviderSettings,
    pub audio: ToggleProviderSettings,
    pub video: ToggleProviderSettings,
    pub folder: ToggleProviderSettings,
}

impl Default for PreviewProvidersSettings {
    fn default() -> Self {
        Self {
            image: SizedProviderSettings::enabled_up_to(25),
            text: SizedProviderSettings::enabled_up_to(1),
            markdown: SizedProviderSettings::enabled_up_to(1),
            json: SizedProviderSettings::enabled_up_to(2),
            csv: SizedProviderSettings::enabled_up_to(5),
            pdf: SizedProviderSettings::enabled_up_to(100),
            audio: ToggleProviderSettings::default(),
            video: ToggleProviderSettings::default(),
            folder: ToggleProviderSettings::default(),
        }
    }
}
