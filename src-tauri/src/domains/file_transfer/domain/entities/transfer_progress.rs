use std::path::PathBuf;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TransferProgress {
    pub bytes_done: u64,
    pub bytes_total: u64,
    pub files_done: u64,
    pub files_total: u64,
    pub current_path: PathBuf,
}
