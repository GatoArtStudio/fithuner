use std::path::Path;

use crate::domains::file_operations::domain::FileOperationError;

pub trait TrashPort: Send + Sync {
    fn move_to_trash(&self, path: &Path) -> Result<(), FileOperationError>;

    /// Takes the most recently trashed item that was deleted from `path` back to `path`.
    fn restore(&self, path: &Path) -> Result<(), FileOperationError>;
}
