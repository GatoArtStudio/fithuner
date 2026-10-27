use crate::domains::settings::domain::{
    AppearanceSettings, BrowsingSettings, PreviewSettings, UpdateSettings,
};

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct AppSettings {
    pub appearance: AppearanceSettings,
    pub browsing: BrowsingSettings,
    pub preview: PreviewSettings,
    pub updates: UpdateSettings,
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

    #[test]
    fn updates_are_checked_at_startup_but_never_installed_automatically() {
        let updates = AppSettings::default().updates;

        assert!(updates.check_on_startup);
        assert!(!updates.auto_download);
    }

    #[test]
    fn preview_is_on_by_default_with_conservative_size_limits() {
        let preview = AppSettings::default().preview;

        assert!(preview.panel_enabled && preview.show_panel && preview.quick_look_enabled);
        assert_eq!(preview.panel_size_px, 340);
        assert_eq!(preview.providers.text.max_size_megabytes, 1);
        assert_eq!(preview.providers.pdf.max_size_megabytes, 100);
        assert!(preview.providers.video.enabled);
    }
}
