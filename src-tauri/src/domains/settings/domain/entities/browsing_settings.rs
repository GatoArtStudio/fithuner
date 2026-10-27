#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct BrowsingSettings {
    pub show_hidden_files: bool,
    pub confirm_before_trash: bool,
}
