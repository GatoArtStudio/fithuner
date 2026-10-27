use crate::domains::file_transfer::application::ports::{
    ConflictResolverPort, TransferProgressPort,
};
use crate::domains::file_transfer::domain::{
    CancellationToken, FileTransferError, TransferOutcome, TransferRequest,
};

pub trait TransferEntriesUseCase: Send + Sync {
    fn execute(
        &self,
        request: TransferRequest,
        progress: &dyn TransferProgressPort,
        conflict_resolver: &dyn ConflictResolverPort,
        cancellation: &CancellationToken,
    ) -> Result<TransferOutcome, FileTransferError>;
}
