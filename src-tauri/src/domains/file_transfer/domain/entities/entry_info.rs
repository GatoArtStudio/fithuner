use crate::domains::file_transfer::domain::EntryKind;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct EntryInfo {
    pub kind: EntryKind,
    pub size_in_bytes: u64,
    pub modified_at_millis: Option<u64>,
}
