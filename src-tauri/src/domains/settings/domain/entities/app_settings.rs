use crate::domains::settings::domain::{AppearanceSettings, BrowsingSettings};

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct AppSettings {
    pub appearance: AppearanceSettings,
    pub browsing: BrowsingSettings,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domains::settings::domain::ThemePreference;

    #[test]
    fn defaults_follow_the_system_theme_and_hide_hidden_files() {
        let settings = AppSettings::default();

        assert_eq!(settings.appearance.theme, ThemePreference::System);
        assert!(!settings.browsing.show_hidden_files);
        assert!(!settings.browsing.confirm_before_trash);
    }
}
