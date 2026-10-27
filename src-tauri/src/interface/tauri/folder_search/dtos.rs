use std::path::PathBuf;

use serde::{Deserialize, Serialize};

use crate::domains::folder_search::domain::{
    EntryKind, FolderSearchError, SearchKindFilter, SearchMatch, SearchQuery, SearchSummary,
};

#[derive(Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SearchKindFilterDto {
    All,
    Folders,
    Files,
    Images,
    Documents,
    Audio,
    Video,
    Archives,
    Code,
}

impl From<SearchKindFilterDto> for SearchKindFilter {
    fn from(filter: SearchKindFilterDto) -> Self {
        match filter {
            SearchKindFilterDto::All => Self::All,
            SearchKindFilterDto::Folders => Self::Folders,
            SearchKindFilterDto::Files => Self::Files,
            SearchKindFilterDto::Images => Self::Images,
            SearchKindFilterDto::Documents => Self::Documents,
            SearchKindFilterDto::Audio => Self::Audio,
            SearchKindFilterDto::Video => Self::Video,
            SearchKindFilterDto::Archives => Self::Archives,
            SearchKindFilterDto::Code => Self::Code,
        }
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchRequestDto {
    root: String,
    text: String,
    include_hidden: bool,
    kind_filter: SearchKindFilterDto,
}

impl From<SearchRequestDto> for SearchQuery {
    fn from(request: SearchRequestDto) -> Self {
        Self {
            root: PathBuf::from(request.root),
            text: request.text,
            include_hidden: request.include_hidden,
            kind_filter: request.kind_filter.into(),
        }
    }
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SearchMatchDto {
    path: String,
    name: String,
    relative_folder: String,
    kind: &'static str,
    size_in_bytes: u64,
    modified_at_millis: Option<u64>,
}

impl From<SearchMatch> for SearchMatchDto {
    fn from(found: SearchMatch) -> Self {
        Self {
            path: found.path.to_string_lossy().into_owned(),
            name: found.name,
            relative_folder: found.relative_folder,
            kind: match found.kind {
                EntryKind::File => "file",
                EntryKind::Directory => "directory",
            },
            size_in_bytes: found.size_in_bytes,
            modified_at_millis: found.modified_at_millis,
        }
    }
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SearchMatchesDto {
    pub search_id: String,
    pub matches: Vec<SearchMatchDto>,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SearchErrorDto {
    kind: &'static str,
    message: String,
}

impl From<FolderSearchError> for SearchErrorDto {
    fn from(error: FolderSearchError) -> Self {
        Self {
            kind: match error {
                FolderSearchError::NotFound => "notFound",
                FolderSearchError::PermissionDenied => "permissionDenied",
                FolderSearchError::NotADirectory => "notADirectory",
                FolderSearchError::EmptyQuery => "emptyQuery",
                FolderSearchError::Unexpected(_) => "unexpected",
            },
            message: error.to_string(),
        }
    }
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SearchFinishedDto {
    search_id: String,
    total_matches: u64,
    scanned_entries: u64,
    is_truncated: bool,
    was_cancelled: bool,
    error: Option<SearchErrorDto>,
}

impl SearchFinishedDto {
    pub fn from_result(search_id: &str, result: Result<SearchSummary, FolderSearchError>) -> Self {
        let (summary, error) = match result {
            Ok(summary) => (summary, None),
            Err(error) => (SearchSummary::default(), Some(error.into())),
        };
        Self {
            search_id: search_id.to_owned(),
            total_matches: summary.total_matches,
            scanned_entries: summary.scanned_entries,
            is_truncated: summary.is_truncated,
            was_cancelled: summary.was_cancelled,
            error,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn deserializes_a_request_with_lowercase_filters() {
        let request: SearchRequestDto = serde_json::from_str(
            r#"{"root":"/home","text":"report","includeHidden":true,"kindFilter":"images"}"#,
        )
        .unwrap();

        let query = SearchQuery::from(request);

        assert_eq!(query.root, PathBuf::from("/home"));
        assert!(query.include_hidden);
        assert_eq!(query.kind_filter, SearchKindFilter::Images);
    }

    #[test]
    fn finished_events_carry_the_summary_or_the_error() {
        let ok = SearchFinishedDto::from_result(
            "search-1",
            Ok(SearchSummary {
                total_matches: 3,
                scanned_entries: 9,
                is_truncated: false,
                was_cancelled: false,
            }),
        );
        let failed = SearchFinishedDto::from_result("search-2", Err(FolderSearchError::EmptyQuery));

        let ok_json = serde_json::to_value(ok).unwrap();
        let failed_json = serde_json::to_value(failed).unwrap();

        assert_eq!(ok_json["totalMatches"], 3);
        assert!(ok_json["error"].is_null());
        assert_eq!(failed_json["error"]["kind"], "emptyQuery");
    }
}
