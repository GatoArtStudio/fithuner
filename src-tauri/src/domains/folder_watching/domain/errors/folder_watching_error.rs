use std::fmt;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum FolderWatchingError {
    Unexpected(String),
}

impl fmt::Display for FolderWatchingError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Unexpected(reason) => write!(formatter, "Could not watch the folders: {reason}"),
        }
    }
}

impl std::error::Error for FolderWatchingError {}
