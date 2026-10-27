use std::path::PathBuf;
use std::sync::Arc;

use crate::domains::file_operations::application::ports::{RestoreEntriesUseCase, TrashPort};
use crate::domains::file_operations::domain::BatchOutcome;

pub struct RestoreEntries {
    trash: Arc<dyn TrashPort>,
}

impl RestoreEntries {
    pub fn new(trash: Arc<dyn TrashPort>) -> Self {
        Self { trash }
    }
}

impl RestoreEntriesUseCase for RestoreEntries {
    fn execute(&self, paths: Vec<PathBuf>) -> BatchOutcome {
        let mut outcome = BatchOutcome::default();
        for path in paths {
            match self.trash.restore(&path) {
                Ok(()) => outcome.succeeded.push(path),
                Err(error) => outcome.failed.push((path, error)),
            }
        }
        outcome
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domains::file_operations::application::use_cases::fake_ports::InMemoryEntries;
    use crate::domains::file_operations::domain::FileOperationError;

    #[test]
    fn brings_trashed_entries_back() {
        let entries = Arc::new(InMemoryEntries::with_entries(&["/docs/a.txt"]));
        entries
            .move_to_trash(std::path::Path::new("/docs/a.txt"))
            .unwrap();
        assert!(!entries.contains("/docs/a.txt"));

        let outcome =
            RestoreEntries::new(entries.clone()).execute(vec![PathBuf::from("/docs/a.txt")]);

        assert_eq!(outcome.succeeded, vec![PathBuf::from("/docs/a.txt")]);
        assert!(entries.contains("/docs/a.txt"));
    }

    #[test]
    fn reports_what_is_not_in_the_trash_or_would_collide() {
        let entries = Arc::new(InMemoryEntries::with_entries(&[
            "/docs/a.txt",
            "/docs/b.txt",
        ]));
        entries
            .move_to_trash(std::path::Path::new("/docs/b.txt"))
            .unwrap();
        entries.create_back("/docs/b.txt");

        let outcome = RestoreEntries::new(entries.clone()).execute(vec![
            PathBuf::from("/docs/never-trashed.txt"),
            PathBuf::from("/docs/b.txt"),
        ]);

        assert_eq!(
            outcome.failed,
            vec![
                (
                    PathBuf::from("/docs/never-trashed.txt"),
                    FileOperationError::NotFound
                ),
                (
                    PathBuf::from("/docs/b.txt"),
                    FileOperationError::AlreadyExists
                ),
            ]
        );
    }
}
