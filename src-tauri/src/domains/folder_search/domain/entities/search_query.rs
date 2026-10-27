use std::path::PathBuf;

use crate::domains::folder_search::domain::SearchKindFilter;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SearchQuery {
    pub root: PathBuf,
    pub text: String,
    pub include_hidden: bool,
    pub kind_filter: SearchKindFilter,
}
