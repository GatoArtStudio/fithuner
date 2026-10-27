use std::path::Path;

use crate::domains::file_operations::application::FileOpenerPort;
use crate::domains::file_operations::domain::FileOperationError;

pub struct SystemFileOpener;

impl FileOpenerPort for SystemFileOpener {
    fn open_with_default_application(&self, path: &Path) -> Result<(), FileOperationError> {
        if !path.exists() {
            return Err(FileOperationError::NotFound);
        }
        opener::open(path).map_err(|error| FileOperationError::Unexpected(error.to_string()))
    }
}
