use std::path::PathBuf;

use crate::domains::file_transfer::domain::FileTransferError;

#[derive(Debug, Default, PartialEq, Eq)]
pub struct TransferOutcome {
    pub transferred_files: u64,
    pub skipped: Vec<PathBuf>,
    pub failed: Vec<(PathBuf, FileTransferError)>,
    pub cancelled: bool,
}
