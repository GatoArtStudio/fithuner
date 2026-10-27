#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ConflictResolution {
    Replace,
    Skip,
    KeepBoth,
    Cancel,
}
