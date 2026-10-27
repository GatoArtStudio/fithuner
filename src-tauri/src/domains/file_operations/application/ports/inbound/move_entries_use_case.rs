use crate::domains::file_operations::domain::{BatchOutcome, EntryMove};

pub trait MoveEntriesUseCase: Send + Sync {
    /// Moves every entry to its exact target path without ever replacing something that already exists.
    fn execute(&self, moves: Vec<EntryMove>) -> BatchOutcome;
}
