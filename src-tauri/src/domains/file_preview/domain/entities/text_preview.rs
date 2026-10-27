#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TextPreview {
    pub content: String,
    pub is_truncated: bool,
    pub total_bytes: u64,
}
