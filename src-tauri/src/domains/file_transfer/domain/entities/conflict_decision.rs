use crate::domains::file_transfer::domain::ConflictResolution;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ConflictDecision {
    pub resolution: ConflictResolution,
    pub apply_to_all: bool,
}
