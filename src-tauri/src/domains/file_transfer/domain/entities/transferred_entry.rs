use std::path::PathBuf;

/// A top-level entry that was created at `to` from `from` and can therefore be undone.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TransferredEntry {
    pub from: PathBuf,
    pub to: PathBuf,
}
