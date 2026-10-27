use std::fmt;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum FolderSearchError {
    NotFound,
    PermissionDenied,
    NotADirectory,
    EmptyQuery,
    Unexpected(String),
}

impl fmt::Display for FolderSearchError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::NotFound => write!(formatter, "The folder does not exist"),
            Self::PermissionDenied => write!(formatter, "Permission denied"),
            Self::NotADirectory => write!(formatter, "The path is not a folder"),
            Self::EmptyQuery => write!(formatter, "Type something to search for"),
            Self::Unexpected(reason) => write!(formatter, "Unexpected error: {reason}"),
        }
    }
}

impl std::error::Error for FolderSearchError {}
