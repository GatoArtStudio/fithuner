use std::path::PathBuf;

use crate::domains::file_operations::domain::BatchOutcome;

pub trait RestoreEntriesUseCase: Send + Sync {
    /// Brings entries back from the trash to the folders they were deleted from.
    fn execute(&self, paths: Vec<PathBuf>) -> BatchOutcome;
}
