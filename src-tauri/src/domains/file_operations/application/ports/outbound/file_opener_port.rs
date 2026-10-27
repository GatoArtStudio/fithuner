use std::path::Path;

use crate::domains::file_operations::domain::FileOperationError;

pub trait FileOpenerPort: Send + Sync {
    fn open_with_default_application(&self, path: &Path) -> Result<(), FileOperationError>;
}
