use std::path::PathBuf;

use crate::domains::file_transfer::domain::TransferMode;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TransferRequest {
    pub sources: Vec<PathBuf>,
    pub destination_directory: PathBuf,
    pub mode: TransferMode,
}
