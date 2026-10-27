use std::sync::Mutex;
use std::sync::mpsc::Receiver;
use std::time::{Duration, Instant};

use tauri::{AppHandle, Emitter};

use super::dtos::{TransferConflictDto, TransferFinishedDto, TransferProgressDto};
use crate::domains::file_transfer::application::{ConflictResolverPort, TransferProgressPort};
use crate::domains::file_transfer::domain::{
    ConflictDecision, ConflictResolution, TransferConflict, TransferProgress,
};

pub const PROGRESS_EVENT: &str = "transfer-progress";
pub const CONFLICT_EVENT: &str = "transfer-conflict";
pub const FINISHED_EVENT: &str = "transfer-finished";

const MIN_PROGRESS_INTERVAL: Duration = Duration::from_millis(100);

pub struct TauriProgressReporter {
    app: AppHandle,
    transfer_id: String,
    last_emitted_at: Mutex<Option<Instant>>,
}

impl TauriProgressReporter {
    pub fn new(app: AppHandle, transfer_id: String) -> Self {
        Self {
            app,
            transfer_id,
            last_emitted_at: Mutex::new(None),
        }
    }
}

impl TransferProgressPort for TauriProgressReporter {
    fn report(&self, progress: &TransferProgress) {
        let mut last_emitted_at = self.last_emitted_at.lock().unwrap();
        let is_due =
            last_emitted_at.is_none_or(|instant| instant.elapsed() >= MIN_PROGRESS_INTERVAL);
        if !is_due {
            return;
        }
        *last_emitted_at = Some(Instant::now());
        let _ = self.app.emit(
            PROGRESS_EVENT,
            TransferProgressDto::new(&self.transfer_id, progress),
        );
    }
}

pub struct ChannelConflictResolver {
    app: AppHandle,
    transfer_id: String,
    decisions: Mutex<Receiver<ConflictDecision>>,
}

impl ChannelConflictResolver {
    pub fn new(app: AppHandle, transfer_id: String, decisions: Receiver<ConflictDecision>) -> Self {
        Self {
            app,
            transfer_id,
            decisions: Mutex::new(decisions),
        }
    }
}

impl ConflictResolverPort for ChannelConflictResolver {
    fn resolve(&self, conflict: &TransferConflict) -> ConflictDecision {
        let _ = self.app.emit(
            CONFLICT_EVENT,
            TransferConflictDto::new(&self.transfer_id, conflict),
        );

        self.decisions
            .lock()
            .unwrap()
            .recv()
            .unwrap_or(ConflictDecision {
                resolution: ConflictResolution::Cancel,
                apply_to_all: false,
            })
    }
}

pub fn emit_finished(app: &AppHandle, finished: TransferFinishedDto) {
    let _ = app.emit(FINISHED_EVENT, finished);
}
