use std::path::Path;

use crate::domains::file_operations::application::TrashPort;
use crate::domains::file_operations::domain::FileOperationError;

pub struct TrashCrateAdapter;

impl TrashPort for TrashCrateAdapter {
    fn move_to_trash(&self, path: &Path) -> Result<(), FileOperationError> {
        if std::fs::symlink_metadata(path).is_err() {
            return Err(FileOperationError::NotFound);
        }
        trash::delete(path).map_err(|error| FileOperationError::Unexpected(error.to_string()))
    }
}
