use std::time::Duration;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct FolderWalkLimits {
    pub max_entries: u64,
    pub max_duration: Duration,
}

impl Default for FolderWalkLimits {
    fn default() -> Self {
        Self {
            max_entries: 50_000,
            max_duration: Duration::from_secs(2),
        }
    }
}
