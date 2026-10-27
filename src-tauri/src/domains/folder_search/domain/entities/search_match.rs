use std::path::PathBuf;

use crate::domains::folder_search::domain::EntryKind;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SearchMatch {
    pub path: PathBuf,
    pub name: String,
    pub relative_folder: String,
    pub kind: EntryKind,
    pub size_in_bytes: u64,
    pub modified_at_millis: Option<u64>,
}
