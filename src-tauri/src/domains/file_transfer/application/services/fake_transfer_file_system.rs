use std::collections::{BTreeMap, HashSet};
use std::path::{Path, PathBuf};
use std::sync::Mutex;

use crate::domains::file_transfer::application::ports::TransferFileSystemPort;
use crate::domains::file_transfer::domain::{EntryInfo, EntryKind, FileTransferError};

#[derive(Debug, Clone, PartialEq, Eq)]
enum Node {
    File { size: u64 },
    Directory,
    Symlink,
}

#[derive(Default)]
pub struct FakeTransferFileSystem {
    nodes: Mutex<BTreeMap<PathBuf, Node>>,
    unreadable: Mutex<HashSet<PathBuf>>,
    crosses_devices: bool,
}

impl FakeTransferFileSystem {
    pub fn new() -> Self {
        let file_system = Self::default();
        file_system.add_directory("/");
        file_system
    }

    pub fn on_another_device(mut self) -> Self {
        self.crosses_devices = true;
        self
    }

    pub fn add_directory(&self, path: &str) {
        let mut nodes = self.nodes.lock().unwrap();
        for ancestor in Path::new(path).ancestors() {
            nodes
                .entry(ancestor.to_path_buf())
                .or_insert(Node::Directory);
        }
    }

    pub fn add_file(&self, path: &str, size: u64) {
        if let Some(parent) = Path::new(path).parent() {
            self.add_directory(&parent.to_string_lossy());
        }
        self.nodes
            .lock()
            .unwrap()
            .insert(PathBuf::from(path), Node::File { size });
    }

    pub fn make_unreadable(&self, path: &str) {
        self.unreadable.lock().unwrap().insert(PathBuf::from(path));
    }

    pub fn contains(&self, path: &str) -> bool {
        self.nodes.lock().unwrap().contains_key(Path::new(path))
    }

    pub fn file_size(&self, path: &str) -> Option<u64> {
        match self.nodes.lock().unwrap().get(Path::new(path)) {
            Some(Node::File { size }) => Some(*size),
            _ => None,
        }
    }

    pub fn paths_under(&self, prefix: &str) -> Vec<String> {
        self.nodes
            .lock()
            .unwrap()
            .keys()
            .filter(|path| path.starts_with(prefix) && *path != Path::new(prefix))
            .map(|path| path.to_string_lossy().into_owned())
            .collect()
    }
}

impl TransferFileSystemPort for FakeTransferFileSystem {
    fn entry_info(&self, path: &Path) -> Result<EntryInfo, FileTransferError> {
        match self.nodes.lock().unwrap().get(path) {
            Some(Node::File { size }) => Ok(EntryInfo {
                kind: EntryKind::File,
                size_in_bytes: *size,
                modified_at_millis: None,
            }),
            Some(Node::Directory) => Ok(EntryInfo {
                kind: EntryKind::Directory,
                size_in_bytes: 0,
                modified_at_millis: None,
            }),
            Some(Node::Symlink) => Ok(EntryInfo {
                kind: EntryKind::Symlink,
                size_in_bytes: 0,
                modified_at_millis: None,
            }),
            None => Err(FileTransferError::NotFound),
        }
    }

    fn exists(&self, path: &Path) -> bool {
        self.nodes.lock().unwrap().contains_key(path)
    }

    fn read_children(&self, directory: &Path) -> Result<Vec<PathBuf>, FileTransferError> {
        Ok(self
            .nodes
            .lock()
            .unwrap()
            .keys()
            .filter(|path| path.parent() == Some(directory))
            .cloned()
            .collect())
    }

    fn canonicalize(&self, path: &Path) -> Result<PathBuf, FileTransferError> {
        if self.exists(path) {
            Ok(path.to_path_buf())
        } else {
            Err(FileTransferError::NotFound)
        }
    }

    fn create_directory(&self, path: &Path) -> Result<(), FileTransferError> {
        self.nodes
            .lock()
            .unwrap()
            .entry(path.to_path_buf())
            .or_insert(Node::Directory);
        Ok(())
    }

    fn rename(&self, from: &Path, to: &Path) -> Result<(), FileTransferError> {
        if self.crosses_devices {
            return Err(FileTransferError::CrossesDevices);
        }
        let mut nodes = self.nodes.lock().unwrap();
        let moved: Vec<PathBuf> = nodes
            .keys()
            .filter(|path| path.starts_with(from))
            .cloned()
            .collect();
        for old_path in moved {
            let node = nodes.remove(&old_path).unwrap();
            let relative = old_path.strip_prefix(from).unwrap();
            nodes.insert(to.join(relative), node);
        }
        Ok(())
    }

    fn remove_entry(&self, path: &Path) -> Result<(), FileTransferError> {
        self.nodes
            .lock()
            .unwrap()
            .retain(|existing, _| !existing.starts_with(path));
        Ok(())
    }

    fn copy_symlink(&self, _source: &Path, target: &Path) -> Result<(), FileTransferError> {
        self.nodes
            .lock()
            .unwrap()
            .insert(target.to_path_buf(), Node::Symlink);
        Ok(())
    }

    fn copy_file(
        &self,
        source: &Path,
        target: &Path,
        on_chunk: &mut dyn FnMut(u64) -> bool,
    ) -> Result<(), FileTransferError> {
        if self.unreadable.lock().unwrap().contains(source) {
            return Err(FileTransferError::PermissionDenied);
        }
        let size = match self.nodes.lock().unwrap().get(source) {
            Some(Node::File { size }) => *size,
            _ => return Err(FileTransferError::NotFound),
        };
        if !on_chunk(size) {
            return Err(FileTransferError::Cancelled);
        }
        self.nodes
            .lock()
            .unwrap()
            .insert(target.to_path_buf(), Node::File { size });
        Ok(())
    }
}
