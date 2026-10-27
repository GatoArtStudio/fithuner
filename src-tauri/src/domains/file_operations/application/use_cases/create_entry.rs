use std::path::{Path, PathBuf};
use std::sync::Arc;

use crate::domains::file_operations::application::ports::{CreateEntryUseCase, EntryWriterPort};
use crate::domains::file_operations::domain::{
    FileOperationError, NewEntryKind, UniqueNameGenerator,
};

pub struct CreateEntry {
    entry_writer: Arc<dyn EntryWriterPort>,
}

impl CreateEntry {
    pub fn new(entry_writer: Arc<dyn EntryWriterPort>) -> Self {
        Self { entry_writer }
    }
}

impl CreateEntryUseCase for CreateEntry {
    fn execute(
        &self,
        parent_directory: &Path,
        kind: NewEntryKind,
    ) -> Result<PathBuf, FileOperationError> {
        let existing_names = self.entry_writer.list_entry_names(parent_directory)?;
        let new_path = parent_directory.join(UniqueNameGenerator::generate(kind, &existing_names));

        match kind {
            NewEntryKind::File => self.entry_writer.create_file(&new_path)?,
            NewEntryKind::Directory => self.entry_writer.create_directory(&new_path)?,
        }
        Ok(new_path)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domains::file_operations::application::use_cases::fake_ports::InMemoryEntries;

    #[test]
    fn creates_a_folder_with_a_free_default_name() {
        let entries = Arc::new(InMemoryEntries::with_entries(&["/docs/New folder"]));

        let created = CreateEntry::new(entries.clone())
            .execute(Path::new("/docs"), NewEntryKind::Directory)
            .unwrap();

        assert_eq!(created, PathBuf::from("/docs/New folder (2)"));
        assert!(entries.contains("/docs/New folder (2)"));
    }

    #[test]
    fn creates_a_file_with_the_default_name() {
        let entries = Arc::new(InMemoryEntries::default());

        let created = CreateEntry::new(entries)
            .execute(Path::new("/docs"), NewEntryKind::File)
            .unwrap();

        assert_eq!(created, PathBuf::from("/docs/New file.txt"));
    }
}
