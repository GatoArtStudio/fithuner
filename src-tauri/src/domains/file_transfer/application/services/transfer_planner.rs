use std::path::Path;

use crate::domains::file_transfer::application::ports::TransferFileSystemPort;
use crate::domains::file_transfer::domain::EntryKind;

#[derive(Debug, Default, Clone, Copy, PartialEq, Eq)]
pub struct TreeTotals {
    pub bytes: u64,
    pub files: u64,
}

pub struct TransferPlanner;

impl TransferPlanner {
    pub fn measure(file_system: &dyn TransferFileSystemPort, path: &Path) -> TreeTotals {
        let Ok(info) = file_system.entry_info(path) else {
            return TreeTotals::default();
        };

        match info.kind {
            EntryKind::File => TreeTotals {
                bytes: info.size_in_bytes,
                files: 1,
            },
            EntryKind::Symlink => TreeTotals { bytes: 0, files: 1 },
            EntryKind::Directory => file_system
                .read_children(path)
                .unwrap_or_default()
                .iter()
                .map(|child| Self::measure(file_system, child))
                .fold(TreeTotals::default(), |total, child| TreeTotals {
                    bytes: total.bytes + child.bytes,
                    files: total.files + child.files,
                }),
        }
    }
}
