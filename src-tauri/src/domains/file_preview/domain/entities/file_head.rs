#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FileHead {
    pub bytes: Vec<u8>,
    pub total_bytes: u64,
}
