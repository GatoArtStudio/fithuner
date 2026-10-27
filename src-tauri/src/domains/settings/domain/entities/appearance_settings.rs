use crate::domains::settings::domain::ThemePreference;

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct AppearanceSettings {
    pub theme: ThemePreference,
}
