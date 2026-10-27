use std::sync::Arc;
use std::thread;
use std::time::Instant;

use tauri::{AppHandle, Emitter, State};

use super::dtos::{SearchFinishedDto, SearchMatchDto, SearchMatchesDto, SearchRequestDto};
use super::match_batcher::MatchBatcher;
use super::sessions::SearchSessions;
use crate::domains::folder_search::application::SearchFolderUseCase;

pub const MATCHES_EVENT: &str = "search-matches";
pub const FINISHED_EVENT: &str = "search-finished";

#[tauri::command]
pub fn start_search(
    app: AppHandle,
    use_case: State<'_, Arc<dyn SearchFolderUseCase>>,
    sessions: State<'_, Arc<SearchSessions>>,
    request: SearchRequestDto,
) -> String {
    let (search_id, cancellation) = sessions.register();
    let use_case = use_case.inner().clone();
    let sessions = sessions.inner().clone();
    let returned_id = search_id.clone();

    thread::spawn(move || {
        let mut batcher = MatchBatcher::new();
        let emit_matches = |matches: Vec<SearchMatchDto>| {
            let _ = app.emit(
                MATCHES_EVENT,
                SearchMatchesDto {
                    search_id: search_id.clone(),
                    matches,
                },
            );
        };

        let result = use_case.execute(
            request.into(),
            &mut |found| {
                if let Some(batch) = batcher.push(SearchMatchDto::from(found), Instant::now()) {
                    emit_matches(batch);
                }
            },
            &cancellation,
        );

        let leftovers = batcher.take();
        if !leftovers.is_empty() {
            emit_matches(leftovers);
        }
        sessions.remove(&search_id);
        let _ = app.emit(
            FINISHED_EVENT,
            SearchFinishedDto::from_result(&search_id, result),
        );
    });

    returned_id
}

#[tauri::command]
pub fn cancel_search(sessions: State<'_, Arc<SearchSessions>>, search_id: String) {
    sessions.cancel(&search_id);
}
