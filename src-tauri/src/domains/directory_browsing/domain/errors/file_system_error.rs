use std::fmt;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum FileSystemError {
    NotFound,
    PermissionDenied,
    NotADirectory,
    Unexpected(String),
}

impl fmt::Display for FileSystemError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::NotFound => write!(formatter, "The path does not exist"),
            Self::PermissionDenied => write!(formatter, "Permission denied"),
            Self::NotADirectory => write!(formatter, "The path is not a folder"),
            Self::Unexpected(reason) => write!(formatter, "Unexpected error: {reason}"),
        }
    }
}

impl std::error::Error for FileSystemError {}
