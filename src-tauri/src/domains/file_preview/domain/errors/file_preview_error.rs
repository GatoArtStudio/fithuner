use std::fmt;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum FilePreviewError {
    NotFound,
    PermissionDenied,
    NotAFile,
    NotADirectory,
    Unexpected(String),
}

impl fmt::Display for FilePreviewError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::NotFound => write!(formatter, "The item does not exist"),
            Self::PermissionDenied => write!(formatter, "Permission denied"),
            Self::NotAFile => write!(formatter, "The item is not a file"),
            Self::NotADirectory => write!(formatter, "The item is not a folder"),
            Self::Unexpected(reason) => write!(formatter, "Unexpected error: {reason}"),
        }
    }
}

impl std::error::Error for FilePreviewError {}
