use std::path::PathBuf;

use crate::domains::file_operations::domain::FileOperationError;

#[derive(Debug, Default, PartialEq, Eq)]
pub struct BatchOutcome {
    pub succeeded: Vec<PathBuf>,
    pub failed: Vec<(PathBuf, FileOperationError)>,
}
