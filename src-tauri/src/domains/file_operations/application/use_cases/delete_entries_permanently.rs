use std::path::PathBuf;
use std::sync::Arc;

use crate::domains::file_operations::application::ports::{
    DeleteEntriesPermanentlyUseCase, EntryWriterPort,
};
use crate::domains::file_operations::domain::BatchOutcome;

pub struct DeleteEntriesPermanently {
    entry_writer: Arc<dyn EntryWriterPort>,
}

impl DeleteEntriesPermanently {
    pub fn new(entry_writer: Arc<dyn EntryWriterPort>) -> Self {
        Self { entry_writer }
    }
}

impl DeleteEntriesPermanentlyUseCase for DeleteEntriesPermanently {
    fn execute(&self, paths: Vec<PathBuf>) -> BatchOutcome {
        let mut outcome = BatchOutcome::default();
        for path in paths {
            match self.entry_writer.delete_permanently(&path) {
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

    #[test]
    fn deletes_every_requested_entry() {
        let entries = Arc::new(InMemoryEntries::with_entries(&["/docs/a", "/docs/b"]));

        let outcome = DeleteEntriesPermanently::new(entries.clone())
            .execute(vec![PathBuf::from("/docs/a"), PathBuf::from("/docs/b")]);

        assert_eq!(outcome.succeeded.len(), 2);
        assert!(outcome.failed.is_empty());
        assert!(!entries.contains("/docs/a") && !entries.contains("/docs/b"));
    }
}
