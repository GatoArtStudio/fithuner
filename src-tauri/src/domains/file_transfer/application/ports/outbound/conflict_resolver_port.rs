use crate::domains::file_transfer::domain::{ConflictDecision, TransferConflict};

pub trait ConflictResolverPort: Send + Sync {
    /// Blocks until the user decides how to resolve the conflict.
    fn resolve(&self, conflict: &TransferConflict) -> ConflictDecision;
}
