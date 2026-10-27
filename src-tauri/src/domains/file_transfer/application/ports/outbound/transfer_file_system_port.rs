use std::path::{Path, PathBuf};

use crate::domains::file_transfer::domain::{EntryInfo, FileTransferError};

pub trait TransferFileSystemPort: Send + Sync {
    fn entry_info(&self, path: &Path) -> Result<EntryInfo, FileTransferError>;
    fn exists(&self, path: &Path) -> bool;
    fn read_children(&self, directory: &Path) -> Result<Vec<PathBuf>, FileTransferError>;
    fn canonicalize(&self, path: &Path) -> Result<PathBuf, FileTransferError>;
    fn create_directory(&self, path: &Path) -> Result<(), FileTransferError>;
    fn rename(&self, from: &Path, to: &Path) -> Result<(), FileTransferError>;
    fn remove_entry(&self, path: &Path) -> Result<(), FileTransferError>;
    fn copy_symlink(&self, source: &Path, target: &Path) -> Result<(), FileTransferError>;

    /// Copies a file atomically. `on_chunk` receives the bytes just written and returns
    /// `false` to abort, which must leave no partial file behind.
    fn copy_file(
        &self,
        source: &Path,
        target: &Path,
        on_chunk: &mut dyn FnMut(u64) -> bool,
    ) -> Result<(), FileTransferError>;
}
