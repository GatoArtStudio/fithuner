use std::path::Path;

use crate::domains::file_operations::domain::FileOperationError;

pub trait TrashPort: Send + Sync {
    fn move_to_trash(&self, path: &Path) -> Result<(), FileOperationError>;
}
