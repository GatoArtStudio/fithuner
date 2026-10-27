use std::fmt;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SettingsError {
    Unavailable(String),
    Corrupted(String),
}

impl fmt::Display for SettingsError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Unavailable(reason) => write!(formatter, "Settings are unavailable: {reason}"),
            Self::Corrupted(reason) => write!(formatter, "Settings file is corrupted: {reason}"),
        }
    }
}

impl std::error::Error for SettingsError {}
