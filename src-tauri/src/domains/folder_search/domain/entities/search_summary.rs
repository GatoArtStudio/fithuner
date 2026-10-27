#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct SearchSummary {
    pub total_matches: u64,
    pub scanned_entries: u64,
    pub is_truncated: bool,
    pub was_cancelled: bool,
}
