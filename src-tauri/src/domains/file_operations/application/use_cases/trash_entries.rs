use std::path::PathBuf;
use std::sync::Arc;

use crate::domains::file_operations::application::ports::{TrashEntriesUseCase, TrashPort};
use crate::domains::file_operations::domain::BatchOutcome;

pub struct TrashEntries {
    trash: Arc<dyn TrashPort>,
}

impl TrashEntries {
    pub fn new(trash: Arc<dyn TrashPort>) -> Self {
        Self { trash }
    }
}

impl TrashEntriesUseCase for TrashEntries {
    fn execute(&self, paths: Vec<PathBuf>) -> BatchOutcome {
        let mut outcome = BatchOutcome::default();
        for path in paths {
            match self.trash.move_to_trash(&path) {
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
    fn reports_successes_and_failures_separately() {
        let entries = Arc::new(InMemoryEntries::with_entries(&["/docs/a.txt"]));

        let outcome = TrashEntries::new(entries.clone()).execute(vec![
            PathBuf::from("/docs/a.txt"),
            PathBuf::from("/docs/missing.txt"),
        ]);

        assert_eq!(outcome.succeeded, vec![PathBuf::from("/docs/a.txt")]);
        assert_eq!(
            outcome.failed,
            vec![(
                PathBuf::from("/docs/missing.txt"),
                FileOperationError::NotFound
            )]
        );
        assert!(!entries.contains("/docs/a.txt"));
    }
}
