use std::fmt;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ClipboardError {
    Unavailable(String),
}

impl fmt::Display for ClipboardError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Unavailable(reason) => {
                write!(formatter, "The clipboard is unavailable: {reason}")
            }
        }
    }
}

impl std::error::Error for ClipboardError {}
