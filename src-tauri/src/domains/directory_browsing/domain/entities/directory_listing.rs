use std::path::PathBuf;

use super::FileEntry;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DirectoryListing {
    pub path: PathBuf,
    pub parent_path: Option<PathBuf>,
    pub entries: Vec<FileEntry>,
}
