use std::path::Path;

use crate::domains::folder_search::domain::{FolderSearchError, WalkControl, WalkedEntry};

pub trait FolderWalkerPort: Send + Sync {
    /// Visits every entry below `root` (not `root` itself) until the visitor asks to stop.
    fn walk(
        &self,
        root: &Path,
        include_hidden: bool,
        visitor: &mut dyn FnMut(WalkedEntry) -> WalkControl,
    ) -> Result<(), FolderSearchError>;
}
