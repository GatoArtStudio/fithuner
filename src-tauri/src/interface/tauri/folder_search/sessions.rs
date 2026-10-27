use std::collections::HashMap;
use std::sync::Mutex;
use std::sync::atomic::{AtomicU64, Ordering};

use crate::domains::shared_kernel::concurrency::CancellationToken;

#[derive(Default)]
pub struct SearchSessions {
    next_id: AtomicU64,
    tokens: Mutex<HashMap<String, CancellationToken>>,
}

impl SearchSessions {
    pub fn register(&self) -> (String, CancellationToken) {
        let search_id = format!("search-{}", self.next_id.fetch_add(1, Ordering::SeqCst) + 1);
        let token = CancellationToken::default();
        self.tokens
            .lock()
            .unwrap()
            .insert(search_id.clone(), token.clone());
        (search_id, token)
    }

    pub fn cancel(&self, search_id: &str) {
        if let Some(token) = self.tokens.lock().unwrap().get(search_id) {
            token.cancel();
        }
    }

    pub fn remove(&self, search_id: &str) {
        self.tokens.lock().unwrap().remove(search_id);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn gives_every_search_its_own_id_and_token() {
        let sessions = SearchSessions::default();

        let (first_id, first_token) = sessions.register();
        let (second_id, second_token) = sessions.register();
        sessions.cancel(&first_id);

        assert_ne!(first_id, second_id);
        assert!(first_token.is_cancelled());
        assert!(!second_token.is_cancelled());
    }

    #[test]
    fn cancelling_or_removing_an_unknown_search_does_nothing() {
        let sessions = SearchSessions::default();
        let (id, token) = sessions.register();

        sessions.remove(&id);
        sessions.cancel(&id);

        assert!(!token.is_cancelled());
    }
}
