use std::collections::HashMap;
use std::sync::Mutex;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::mpsc::{self, Receiver, Sender};

use crate::domains::file_transfer::domain::{
    CancellationToken, ConflictDecision, ConflictResolution,
};

struct TransferSession {
    cancellation: CancellationToken,
    decision_sender: Sender<ConflictDecision>,
}

pub struct RegisteredSession {
    pub transfer_id: String,
    pub cancellation: CancellationToken,
    pub decision_receiver: Receiver<ConflictDecision>,
}

#[derive(Default)]
pub struct TransferSessions {
    next_id: AtomicU64,
    sessions: Mutex<HashMap<String, TransferSession>>,
}

impl TransferSessions {
    pub fn register(&self) -> RegisteredSession {
        let transfer_id = format!(
            "transfer-{}",
            self.next_id.fetch_add(1, Ordering::SeqCst) + 1
        );
        let cancellation = CancellationToken::default();
        let (decision_sender, decision_receiver) = mpsc::channel();

        self.sessions.lock().unwrap().insert(
            transfer_id.clone(),
            TransferSession {
                cancellation: cancellation.clone(),
                decision_sender,
            },
        );
        RegisteredSession {
            transfer_id,
            cancellation,
            decision_receiver,
        }
    }

    pub fn resolve(&self, transfer_id: &str, decision: ConflictDecision) {
        if let Some(session) = self.sessions.lock().unwrap().get(transfer_id) {
            let _ = session.decision_sender.send(decision);
        }
    }

    pub fn cancel(&self, transfer_id: &str) {
        if let Some(session) = self.sessions.lock().unwrap().get(transfer_id) {
            session.cancellation.cancel();
            let _ = session.decision_sender.send(ConflictDecision {
                resolution: ConflictResolution::Cancel,
                apply_to_all: false,
            });
        }
    }

    pub fn remove(&self, transfer_id: &str) {
        self.sessions.lock().unwrap().remove(transfer_id);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn registers_sessions_with_unique_ids() {
        let sessions = TransferSessions::default();

        let first = sessions.register();
        let second = sessions.register();

        assert_ne!(first.transfer_id, second.transfer_id);
    }

    #[test]
    fn cancelling_flags_the_token_and_unblocks_a_pending_conflict() {
        let sessions = TransferSessions::default();
        let session = sessions.register();

        sessions.cancel(&session.transfer_id);

        assert!(session.cancellation.is_cancelled());
        let decision = session.decision_receiver.recv().unwrap();
        assert_eq!(decision.resolution, ConflictResolution::Cancel);
    }

    #[test]
    fn delivers_the_decision_to_the_waiting_transfer() {
        let sessions = TransferSessions::default();
        let session = sessions.register();

        sessions.resolve(
            &session.transfer_id,
            ConflictDecision {
                resolution: ConflictResolution::Replace,
                apply_to_all: true,
            },
        );

        let decision = session.decision_receiver.recv().unwrap();
        assert_eq!(decision.resolution, ConflictResolution::Replace);
        assert!(decision.apply_to_all);
    }
}
