use std::sync::Arc;

use crate::domains::file_operations::application::ports::{EntryWriterPort, MoveEntriesUseCase};
use crate::domains::file_operations::domain::{BatchOutcome, EntryMove, FileOperationError};

pub struct MoveEntries {
    writer: Arc<dyn EntryWriterPort>,
}

impl MoveEntries {
    pub fn new(writer: Arc<dyn EntryWriterPort>) -> Self {
        Self { writer }
    }

    fn move_one(&self, entry: &EntryMove) -> Result<(), FileOperationError> {
        if !self.writer.entry_exists(&entry.from) {
            return Err(FileOperationError::NotFound);
        }
        if self.writer.entry_exists(&entry.to) {
            return Err(FileOperationError::AlreadyExists);
        }
        self.writer.rename(&entry.from, &entry.to)
    }
}

impl MoveEntriesUseCase for MoveEntries {
    fn execute(&self, moves: Vec<EntryMove>) -> BatchOutcome {
        let mut outcome = BatchOutcome::default();
        for entry in moves {
            match self.move_one(&entry) {
                Ok(()) => outcome.succeeded.push(entry.to),
                Err(error) => outcome.failed.push((entry.from, error)),
            }
        }
        outcome
    }
}

#[cfg(test)]
mod tests {
    use std::path::PathBuf;

    use super::*;
    use crate::domains::file_operations::application::use_cases::fake_ports::InMemoryEntries;

    fn entry_move(from: &str, to: &str) -> EntryMove {
        EntryMove {
            from: PathBuf::from(from),
            to: PathBuf::from(to),
        }
    }

    #[test]
    fn moves_entries_to_their_exact_targets() {
        let entries = Arc::new(InMemoryEntries::with_entries(&["/a/one.txt", "/a/two.txt"]));

        let outcome = MoveEntries::new(entries.clone()).execute(vec![
            entry_move("/a/one.txt", "/b/one.txt"),
            entry_move("/a/two.txt", "/a/renamed.txt"),
        ]);

        assert_eq!(
            outcome.succeeded,
            vec![PathBuf::from("/b/one.txt"), PathBuf::from("/a/renamed.txt")]
        );
        assert!(entries.contains("/b/one.txt") && entries.contains("/a/renamed.txt"));
        assert!(!entries.contains("/a/one.txt") && !entries.contains("/a/two.txt"));
    }

    #[test]
    fn never_replaces_an_existing_target() {
        let entries = Arc::new(InMemoryEntries::with_entries(&["/a/one.txt", "/b/one.txt"]));

        let outcome =
            MoveEntries::new(entries.clone()).execute(vec![entry_move("/a/one.txt", "/b/one.txt")]);

        assert_eq!(
            outcome.failed,
            vec![(
                PathBuf::from("/a/one.txt"),
                FileOperationError::AlreadyExists
            )]
        );
        assert!(entries.contains("/a/one.txt"));
    }

    #[test]
    fn reports_a_missing_source_and_keeps_moving_the_rest() {
        let entries = Arc::new(InMemoryEntries::with_entries(&["/a/two.txt"]));

        let outcome = MoveEntries::new(entries.clone()).execute(vec![
            entry_move("/a/gone.txt", "/b/gone.txt"),
            entry_move("/a/two.txt", "/b/two.txt"),
        ]);

        assert_eq!(
            outcome.failed,
            vec![(PathBuf::from("/a/gone.txt"), FileOperationError::NotFound)]
        );
        assert_eq!(outcome.succeeded, vec![PathBuf::from("/b/two.txt")]);
    }
}
