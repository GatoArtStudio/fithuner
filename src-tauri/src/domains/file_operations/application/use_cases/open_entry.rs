use std::path::{Path, PathBuf};
use std::sync::Arc;

use crate::domains::file_operations::application::ports::{FileOpenerPort, OpenEntryUseCase};
use crate::domains::file_operations::domain::FileOperationError;

pub struct OpenEntry {
    file_opener: Arc<dyn FileOpenerPort>,
}

impl OpenEntry {
    pub fn new(file_opener: Arc<dyn FileOpenerPort>) -> Self {
        Self { file_opener }
    }
}

impl OpenEntryUseCase for OpenEntry {
    fn execute(&self, path: &Path) -> Result<(), FileOperationError> {
        self.file_opener.open_with_default_application(path)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domains::file_operations::application::use_cases::fake_ports::InMemoryEntries;

    #[test]
    fn asks_the_opener_to_open_the_path() {
        let entries = Arc::new(InMemoryEntries::default());

        OpenEntry::new(entries.clone())
            .execute(Path::new("/docs/a.txt"))
            .unwrap();

        assert_eq!(entries.opened_paths(), vec![PathBuf::from("/docs/a.txt")]);
    }
}
