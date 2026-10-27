use std::path::{Path, PathBuf};
use std::sync::Arc;

use crate::domains::file_operations::application::ports::{EntryWriterPort, RenameEntryUseCase};
use crate::domains::file_operations::domain::{EntryName, FileOperationError};

pub struct RenameEntry {
    entry_writer: Arc<dyn EntryWriterPort>,
}

impl RenameEntry {
    pub fn new(entry_writer: Arc<dyn EntryWriterPort>) -> Self {
        Self { entry_writer }
    }
}

impl RenameEntryUseCase for RenameEntry {
    fn execute(&self, path: &Path, new_name: &str) -> Result<PathBuf, FileOperationError> {
        let new_name = EntryName::parse(new_name)?;
        let parent_directory = path.parent().ok_or(FileOperationError::NotFound)?;
        let target_path = parent_directory.join(new_name.as_str());

        if target_path == path {
            return Ok(target_path);
        }
        let only_changes_letter_case = path
            .file_name()
            .and_then(|current_name| current_name.to_str())
            .is_some_and(|current_name| current_name.eq_ignore_ascii_case(new_name.as_str()));
        if !only_changes_letter_case && self.entry_writer.entry_exists(&target_path) {
            return Err(FileOperationError::AlreadyExists);
        }

        self.entry_writer.rename(path, &target_path)?;
        Ok(target_path)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domains::file_operations::application::use_cases::fake_ports::InMemoryEntries;

    fn use_case(entries: &[&str]) -> (RenameEntry, Arc<InMemoryEntries>) {
        let store = Arc::new(InMemoryEntries::with_entries(entries));
        (RenameEntry::new(store.clone()), store)
    }

    #[test]
    fn renames_an_entry_inside_its_folder() {
        let (use_case, store) = use_case(&["/docs/a.txt"]);

        let renamed = use_case.execute(Path::new("/docs/a.txt"), "b.txt").unwrap();

        assert_eq!(renamed, PathBuf::from("/docs/b.txt"));
        assert!(store.contains("/docs/b.txt") && !store.contains("/docs/a.txt"));
    }

    #[test]
    fn refuses_to_overwrite_an_existing_entry() {
        let (use_case, _) = use_case(&["/docs/a.txt", "/docs/b.txt"]);

        let error = use_case
            .execute(Path::new("/docs/a.txt"), "b.txt")
            .unwrap_err();

        assert_eq!(error, FileOperationError::AlreadyExists);
    }

    #[test]
    fn rejects_invalid_names_before_touching_the_file_system() {
        let (use_case, store) = use_case(&["/docs/a.txt"]);

        let error = use_case
            .execute(Path::new("/docs/a.txt"), "a/b")
            .unwrap_err();

        assert!(matches!(error, FileOperationError::InvalidName(_)));
        assert!(store.contains("/docs/a.txt"));
    }

    #[test]
    fn keeps_the_entry_untouched_when_the_name_does_not_change() {
        let (use_case, store) = use_case(&["/docs/a.txt"]);

        let renamed = use_case.execute(Path::new("/docs/a.txt"), "a.txt").unwrap();

        assert_eq!(renamed, PathBuf::from("/docs/a.txt"));
        assert!(store.contains("/docs/a.txt"));
    }

    #[test]
    fn allows_changing_only_the_letter_case() {
        let (use_case, _) = use_case(&["/docs/a.txt"]);

        let renamed = use_case.execute(Path::new("/docs/a.txt"), "A.txt").unwrap();

        assert_eq!(renamed, PathBuf::from("/docs/A.txt"));
    }
}
