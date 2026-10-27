use std::sync::Arc;
use std::thread;

use tauri::{AppHandle, State};

use super::dtos::{ConflictDecisionDto, TransferFinishedDto, TransferRequestDto};
use super::events::{ChannelConflictResolver, TauriProgressReporter, emit_finished};
use super::sessions::TransferSessions;
use crate::domains::file_transfer::application::TransferEntriesUseCase;
use crate::domains::file_transfer::domain::TransferRequest;

#[tauri::command]
pub fn start_transfer(
    app: AppHandle,
    use_case: State<'_, Arc<dyn TransferEntriesUseCase>>,
    sessions: State<'_, Arc<TransferSessions>>,
    request: TransferRequestDto,
) -> String {
    let session = sessions.register();
    let transfer_id = session.transfer_id.clone();
    let use_case = use_case.inner().clone();
    let sessions = sessions.inner().clone();

    let request = TransferRequest {
        sources: request.sources.into_iter().map(Into::into).collect(),
        destination_directory: request.destination_directory.into(),
        mode: request.mode.into(),
    };

    thread::spawn(move || {
        let progress = TauriProgressReporter::new(app.clone(), session.transfer_id.clone());
        let resolver = ChannelConflictResolver::new(
            app.clone(),
            session.transfer_id.clone(),
            session.decision_receiver,
        );
        let result = use_case.execute(request, &progress, &resolver, &session.cancellation);

        emit_finished(
            &app,
            TransferFinishedDto::from_result(&session.transfer_id, result),
        );
        sessions.remove(&session.transfer_id);
    });

    transfer_id
}

#[tauri::command]
pub fn cancel_transfer(sessions: State<'_, Arc<TransferSessions>>, transfer_id: String) {
    sessions.cancel(&transfer_id);
}

#[tauri::command]
pub fn resolve_conflict(
    sessions: State<'_, Arc<TransferSessions>>,
    transfer_id: String,
    decision: ConflictDecisionDto,
) {
    sessions.resolve(&transfer_id, decision.into());
}
