#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SizedProviderSettings {
    pub enabled: bool,
    pub max_size_megabytes: u32,
}

impl SizedProviderSettings {
    pub const fn enabled_up_to(max_size_megabytes: u32) -> Self {
        Self {
            enabled: true,
            max_size_megabytes,
        }
    }
}
