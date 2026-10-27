use std::path::Path;

use crate::domains::file_operations::domain::FileOperationError;

pub trait OpenEntryUseCase: Send + Sync {
    fn execute(&self, path: &Path) -> Result<(), FileOperationError>;
}
