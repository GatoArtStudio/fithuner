mod entities;
mod enums;
mod errors;
mod services;

pub use entities::{SearchMatch, SearchQuery, SearchSummary, WalkedEntry};
pub use enums::{EntryKind, SearchKindFilter, WalkControl};
pub use errors::FolderSearchError;
pub use services::{KindClassifier, NameMatcher};

pub const SEARCH_RESULT_LIMIT: u64 = 10_000;
