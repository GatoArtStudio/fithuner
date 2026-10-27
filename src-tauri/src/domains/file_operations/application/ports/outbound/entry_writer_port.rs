use std::path::Path;

use crate::domains::file_operations::domain::FileOperationError;

pub trait EntryWriterPort: Send + Sync {
    fn entry_exists(&self, path: &Path) -> bool;
    fn list_entry_names(&self, directory: &Path) -> Result<Vec<String>, FileOperationError>;
    fn create_file(&self, path: &Path) -> Result<(), FileOperationError>;
    fn create_directory(&self, path: &Path) -> Result<(), FileOperationError>;
    fn rename(&self, from: &Path, to: &Path) -> Result<(), FileOperationError>;
    fn delete_permanently(&self, path: &Path) -> Result<(), FileOperationError>;
}
