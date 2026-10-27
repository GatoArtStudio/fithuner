use std::path::PathBuf;

use crate::domains::file_operations::domain::BatchOutcome;

pub trait TrashEntriesUseCase: Send + Sync {
    fn execute(&self, paths: Vec<PathBuf>) -> BatchOutcome;
}
