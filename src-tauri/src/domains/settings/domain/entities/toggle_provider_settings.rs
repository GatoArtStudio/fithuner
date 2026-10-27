#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ToggleProviderSettings {
    pub enabled: bool,
}

impl Default for ToggleProviderSettings {
    fn default() -> Self {
        Self { enabled: true }
    }
}
