#[derive(Debug, Clone, PartialEq, Eq)]
pub struct BrowsingSettings {
    pub show_hidden_files: bool,
    pub confirm_before_trash: bool,
    pub restore_tabs_on_startup: bool,
    pub watch_folders: bool,
}

impl Default for BrowsingSettings {
    fn default() -> Self {
        Self {
            show_hidden_files: false,
            confirm_before_trash: false,
            restore_tabs_on_startup: true,
            watch_folders: true,
        }
    }
}
