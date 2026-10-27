use std::path::PathBuf;

use crate::domains::file_transfer::domain::{FileTransferError, TransferredEntry};

#[derive(Debug, Default, PartialEq, Eq)]
pub struct TransferOutcome {
    pub transferred_files: u64,
    pub skipped: Vec<PathBuf>,
    pub failed: Vec<(PathBuf, FileTransferError)>,
    pub cancelled: bool,
    /// Entries newly created by the transfer; merges and replacements are left out because they cannot be undone.
    pub transferred: Vec<TransferredEntry>,
}
