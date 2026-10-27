use crate::domains::file_transfer::domain::TransferProgress;

pub trait TransferProgressPort: Send + Sync {
    fn report(&self, progress: &TransferProgress);
}
