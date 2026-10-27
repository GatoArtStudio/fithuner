use std::fmt;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum FileTransferError {
    NotFound,
    PermissionDenied,
    AlreadyExists,
    InvalidDestination(String),
    CrossesDevices,
    Cancelled,
    Unexpected(String),
}

impl fmt::Display for FileTransferError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::NotFound => write!(formatter, "The item does not exist"),
            Self::PermissionDenied => write!(formatter, "Permission denied"),
            Self::AlreadyExists => write!(formatter, "An item with that name already exists"),
            Self::InvalidDestination(reason) => write!(formatter, "Invalid destination: {reason}"),
            Self::CrossesDevices => write!(formatter, "The destination is on another drive"),
            Self::Cancelled => write!(formatter, "The transfer was cancelled"),
            Self::Unexpected(reason) => write!(formatter, "Unexpected error: {reason}"),
        }
    }
}

impl std::error::Error for FileTransferError {}
