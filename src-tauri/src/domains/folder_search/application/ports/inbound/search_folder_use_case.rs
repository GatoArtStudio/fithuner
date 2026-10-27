use crate::domains::folder_search::domain::{
    FolderSearchError, SearchMatch, SearchQuery, SearchSummary,
};
use crate::domains::shared_kernel::concurrency::CancellationToken;

pub trait SearchFolderUseCase: Send + Sync {
    fn execute(
        &self,
        query: SearchQuery,
        on_match: &mut dyn FnMut(SearchMatch),
        cancellation: &CancellationToken,
    ) -> Result<SearchSummary, FolderSearchError>;
}
