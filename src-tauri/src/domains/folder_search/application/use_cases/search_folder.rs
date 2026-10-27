use std::path::Path;
use std::sync::Arc;

use crate::domains::folder_search::application::ports::{FolderWalkerPort, SearchFolderUseCase};
use crate::domains::folder_search::domain::{
    FolderSearchError, KindClassifier, NameMatcher, SEARCH_RESULT_LIMIT, SearchMatch, SearchQuery,
    SearchSummary, WalkControl,
};
use crate::domains::shared_kernel::concurrency::CancellationToken;

pub struct SearchFolder {
    walker: Arc<dyn FolderWalkerPort>,
}

impl SearchFolder {
    pub fn new(walker: Arc<dyn FolderWalkerPort>) -> Self {
        Self { walker }
    }
}

fn relative_folder_of(path: &Path, root: &Path) -> String {
    path.parent()
        .and_then(|parent| parent.strip_prefix(root).ok())
        .map(|relative| relative.to_string_lossy().into_owned())
        .unwrap_or_default()
}

impl SearchFolderUseCase for SearchFolder {
    fn execute(
        &self,
        query: SearchQuery,
        on_match: &mut dyn FnMut(SearchMatch),
        cancellation: &CancellationToken,
    ) -> Result<SearchSummary, FolderSearchError> {
        let matcher = NameMatcher::new(&query.text).ok_or(FolderSearchError::EmptyQuery)?;
        let mut summary = SearchSummary::default();

        self.walker
            .walk(&query.root, query.include_hidden, &mut |entry| {
                if cancellation.is_cancelled() {
                    summary.was_cancelled = true;
                    return WalkControl::Stop;
                }
                summary.scanned_entries += 1;

                let is_match = KindClassifier::accepts(query.kind_filter, entry.kind, &entry.name)
                    && matcher.matches(&entry.name);
                if !is_match {
                    return WalkControl::Continue;
                }

                summary.total_matches += 1;
                on_match(SearchMatch {
                    relative_folder: relative_folder_of(&entry.path, &query.root),
                    path: entry.path,
                    name: entry.name,
                    kind: entry.kind,
                    size_in_bytes: entry.size_in_bytes,
                    modified_at_millis: entry.modified_at_millis,
                });

                if summary.total_matches >= SEARCH_RESULT_LIMIT {
                    summary.is_truncated = true;
                    return WalkControl::Stop;
                }
                WalkControl::Continue
            })?;

        Ok(summary)
    }
}

#[cfg(test)]
mod tests {
    use std::path::PathBuf;

    use super::*;
    use crate::domains::folder_search::application::use_cases::fake_folder_walker::FakeFolderWalker;
    use crate::domains::folder_search::domain::{EntryKind, SearchKindFilter};

    fn query(text: &str) -> SearchQuery {
        SearchQuery {
            root: PathBuf::from("/data"),
            text: text.into(),
            include_hidden: false,
            kind_filter: SearchKindFilter::All,
        }
    }

    fn search(
        walker: FakeFolderWalker,
        query: SearchQuery,
    ) -> (Result<SearchSummary, FolderSearchError>, Vec<SearchMatch>) {
        let mut matches = Vec::new();
        let result = SearchFolder::new(Arc::new(walker)).execute(
            query,
            &mut |found| matches.push(found),
            &CancellationToken::default(),
        );
        (result, matches)
    }

    #[test]
    fn reports_matching_entries_with_their_folder_relative_to_the_root() {
        let walker = FakeFolderWalker::with(&[
            ("/data/Report 2024.pdf", EntryKind::File),
            ("/data/work/q1/report-final.docx", EntryKind::File),
            ("/data/work/notes.txt", EntryKind::File),
        ]);

        let (result, matches) = search(walker, query("report"));

        assert_eq!(result.unwrap().total_matches, 2);
        assert_eq!(matches[0].relative_folder, "");
        assert_eq!(matches[1].relative_folder, "work/q1");
        assert_eq!(matches[1].name, "report-final.docx");
    }

    #[test]
    fn counts_every_scanned_entry_not_only_the_matches() {
        let walker = FakeFolderWalker::with(&[
            ("/data/a.txt", EntryKind::File),
            ("/data/b.txt", EntryKind::File),
            ("/data/c.txt", EntryKind::File),
        ]);

        let (result, _) = search(walker, query("a"));

        let summary = result.unwrap();
        assert_eq!(summary.scanned_entries, 3);
        assert_eq!(summary.total_matches, 1);
    }

    #[test]
    fn applies_the_kind_filter() {
        let walker = FakeFolderWalker::with(&[
            ("/data/holiday", EntryKind::Directory),
            ("/data/holiday.jpg", EntryKind::File),
            ("/data/holiday.txt", EntryKind::File),
        ]);
        let mut images_only = query("holiday");
        images_only.kind_filter = SearchKindFilter::Images;

        let (_, matches) = search(walker, images_only);

        assert_eq!(matches.len(), 1);
        assert_eq!(matches[0].name, "holiday.jpg");
    }

    #[test]
    fn forwards_the_hidden_files_choice_to_the_walker() {
        let walker = FakeFolderWalker::with(&[]);
        let requested = walker.requested_hidden.clone();
        let mut with_hidden = query("x");
        with_hidden.include_hidden = true;

        let _ = search(walker, with_hidden);

        assert_eq!(*requested.lock().unwrap(), vec![true]);
    }

    #[test]
    fn stops_at_the_result_limit_and_says_so() {
        let paths: Vec<(String, EntryKind)> = (0..SEARCH_RESULT_LIMIT + 50)
            .map(|index| (format!("/data/match-{index}.txt"), EntryKind::File))
            .collect();
        let walker = FakeFolderWalker::from_owned(paths);

        let (result, matches) = search(walker, query("match"));

        let summary = result.unwrap();
        assert!(summary.is_truncated);
        assert_eq!(summary.total_matches, SEARCH_RESULT_LIMIT);
        assert_eq!(matches.len() as u64, SEARCH_RESULT_LIMIT);
    }

    #[test]
    fn stops_when_the_search_is_cancelled() {
        let walker = FakeFolderWalker::with(&[
            ("/data/a1.txt", EntryKind::File),
            ("/data/a2.txt", EntryKind::File),
        ]);
        let cancellation = CancellationToken::default();
        cancellation.cancel();
        let mut matches = Vec::new();

        let summary = SearchFolder::new(Arc::new(walker))
            .execute(query("a"), &mut |found| matches.push(found), &cancellation)
            .unwrap();

        assert!(summary.was_cancelled);
        assert!(matches.is_empty());
    }

    #[test]
    fn rejects_a_blank_query() {
        let (result, _) = search(FakeFolderWalker::with(&[]), query("   "));

        assert_eq!(result.unwrap_err(), FolderSearchError::EmptyQuery);
    }

    #[test]
    fn propagates_walker_errors() {
        let walker = FakeFolderWalker::failing(FolderSearchError::NotFound);

        let (result, _) = search(walker, query("a"));

        assert_eq!(result.unwrap_err(), FolderSearchError::NotFound);
    }
}
