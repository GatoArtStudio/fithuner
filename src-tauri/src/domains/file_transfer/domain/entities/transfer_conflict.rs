use std::path::PathBuf;

use crate::domains::file_transfer::domain::EntryInfo;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TransferConflict {
    pub source: PathBuf,
    pub target: PathBuf,
    pub source_info: EntryInfo,
    pub target_info: EntryInfo,
}
