use std::fmt;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum FileOperationError {
    AlreadyExists,
    NotFound,
    PermissionDenied,
    InvalidName(String),
    Unexpected(String),
}

impl fmt::Display for FileOperationError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::AlreadyExists => write!(formatter, "An item with that name already exists"),
            Self::NotFound => write!(formatter, "The item does not exist"),
            Self::PermissionDenied => write!(formatter, "Permission denied"),
            Self::InvalidName(reason) => write!(formatter, "Invalid name: {reason}"),
            Self::Unexpected(reason) => write!(formatter, "Unexpected error: {reason}"),
        }
    }
}

impl std::error::Error for FileOperationError {}
