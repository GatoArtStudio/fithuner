use std::collections::BTreeSet;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

use crate::domains::file_operations::application::ports::{
    EntryWriterPort, FileOpenerPort, TrashPort,
};
use crate::domains::file_operations::domain::FileOperationError;

#[derive(Default)]
pub struct InMemoryEntries {
    paths: Mutex<BTreeSet<PathBuf>>,
    opened: Mutex<Vec<PathBuf>>,
}

impl InMemoryEntries {
    pub fn with_entries(paths: &[&str]) -> Self {
        Self {
            paths: Mutex::new(paths.iter().map(PathBuf::from).collect()),
            opened: Mutex::default(),
        }
    }

    pub fn contains(&self, path: &str) -> bool {
        self.paths.lock().unwrap().contains(Path::new(path))
    }

    pub fn opened_paths(&self) -> Vec<PathBuf> {
        self.opened.lock().unwrap().clone()
    }
}

impl EntryWriterPort for InMemoryEntries {
    fn entry_exists(&self, path: &Path) -> bool {
        self.paths.lock().unwrap().contains(path)
    }

    fn list_entry_names(&self, directory: &Path) -> Result<Vec<String>, FileOperationError> {
        Ok(self
            .paths
            .lock()
            .unwrap()
            .iter()
            .filter(|path| path.parent() == Some(directory))
            .filter_map(|path| path.file_name()?.to_str().map(str::to_owned))
            .collect())
    }

    fn create_file(&self, path: &Path) -> Result<(), FileOperationError> {
        self.paths.lock().unwrap().insert(path.to_path_buf());
        Ok(())
    }

    fn create_directory(&self, path: &Path) -> Result<(), FileOperationError> {
        self.create_file(path)
    }

    fn rename(&self, from: &Path, to: &Path) -> Result<(), FileOperationError> {
        let mut paths = self.paths.lock().unwrap();
        if !paths.remove(from) {
            return Err(FileOperationError::NotFound);
        }
        paths.insert(to.to_path_buf());
        Ok(())
    }

    fn delete_permanently(&self, path: &Path) -> Result<(), FileOperationError> {
        if self.paths.lock().unwrap().remove(path) {
            Ok(())
        } else {
            Err(FileOperationError::NotFound)
        }
    }
}

impl TrashPort for InMemoryEntries {
    fn move_to_trash(&self, path: &Path) -> Result<(), FileOperationError> {
        self.delete_permanently(path)
    }
}

impl FileOpenerPort for InMemoryEntries {
    fn open_with_default_application(&self, path: &Path) -> Result<(), FileOperationError> {
        self.opened.lock().unwrap().push(path.to_path_buf());
        Ok(())
    }
}
