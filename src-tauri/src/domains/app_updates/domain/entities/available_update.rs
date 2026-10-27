#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AvailableUpdate {
    pub version: String,
    pub notes: Option<String>,
    pub published_at_millis: Option<u64>,
}
