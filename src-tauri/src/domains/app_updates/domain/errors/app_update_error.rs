use std::fmt;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum AppUpdateError {
    NotConfigured,
    Network(String),
    InvalidSignature,
    NotSupported,
    NoUpdateAvailable,
    NothingDownloaded,
    Unexpected(String),
}

impl fmt::Display for AppUpdateError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::NotConfigured => write!(formatter, "Updates are not configured for this build"),
            Self::Network(reason) => {
                write!(formatter, "Could not reach the update server: {reason}")
            }
            Self::InvalidSignature => write!(
                formatter,
                "The update could not be verified and was discarded"
            ),
            Self::NotSupported => write!(formatter, "This installation cannot update itself"),
            Self::NoUpdateAvailable => write!(formatter, "There is no update to download"),
            Self::NothingDownloaded => write!(formatter, "No update has been downloaded yet"),
            Self::Unexpected(reason) => write!(formatter, "Unexpected error: {reason}"),
        }
    }
}

impl std::error::Error for AppUpdateError {}
