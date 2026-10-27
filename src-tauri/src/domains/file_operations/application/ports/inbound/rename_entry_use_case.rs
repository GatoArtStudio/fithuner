use std::path::{Path, PathBuf};

use crate::domains::file_operations::domain::FileOperationError;

pub trait RenameEntryUseCase: Send + Sync {
    fn execute(&self, path: &Path, new_name: &str) -> Result<PathBuf, FileOperationError>;
}
