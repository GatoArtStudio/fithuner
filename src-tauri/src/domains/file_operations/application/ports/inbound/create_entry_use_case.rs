use std::path::{Path, PathBuf};

use crate::domains::file_operations::domain::{FileOperationError, NewEntryKind};

pub trait CreateEntryUseCase: Send + Sync {
    fn execute(
        &self,
        parent_directory: &Path,
        kind: NewEntryKind,
    ) -> Result<PathBuf, FileOperationError>;
}
