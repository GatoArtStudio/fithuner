use std::path::PathBuf;

use crate::domains::directory_browsing::domain::FileEntryKind;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FileEntry {
    pub name: String,
    pub path: PathBuf,
    pub kind: FileEntryKind,
    pub is_symlink: bool,
    pub is_hidden: bool,
    pub size_in_bytes: u64,
    pub modified_at_millis: Option<u64>,
}
