#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct FolderSummary {
    pub file_count: u64,
    pub folder_count: u64,
    pub total_bytes: u64,
    pub is_partial: bool,
}
