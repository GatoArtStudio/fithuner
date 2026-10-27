use std::path::PathBuf;
use std::time::{Duration, Instant};

/// Gathers the folders that changed during a short window so a burst of events becomes one notification per folder.
#[derive(Debug)]
pub struct ChangeCoalescer {
    window: Duration,
    pending: Vec<PathBuf>,
    first_pending_at: Option<Instant>,
}

impl ChangeCoalescer {
    pub fn new(window: Duration) -> Self {
        Self {
            window,
            pending: Vec::new(),
            first_pending_at: None,
        }
    }

    pub fn push(&mut self, folder: PathBuf, now: Instant) {
        if self.first_pending_at.is_none() {
            self.first_pending_at = Some(now);
        }
        if !self.pending.contains(&folder) {
            self.pending.push(folder);
        }
    }

    /// How long until the pending folders are ready, or `None` when nothing is pending.
    pub fn time_until_ready(&self, now: Instant) -> Option<Duration> {
        let first = self.first_pending_at?;
        Some(
            self.window
                .saturating_sub(now.saturating_duration_since(first)),
        )
    }

    pub fn take_ready(&mut self, now: Instant) -> Vec<PathBuf> {
        match self.time_until_ready(now) {
            Some(remaining) if remaining.is_zero() => {
                self.first_pending_at = None;
                std::mem::take(&mut self.pending)
            }
            _ => Vec::new(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const WINDOW: Duration = Duration::from_millis(100);

    #[test]
    fn nothing_is_pending_at_first() {
        let mut coalescer = ChangeCoalescer::new(WINDOW);

        assert_eq!(coalescer.time_until_ready(Instant::now()), None);
        assert!(coalescer.take_ready(Instant::now()).is_empty());
    }

    #[test]
    fn holds_changes_until_the_window_has_passed() {
        let start = Instant::now();
        let mut coalescer = ChangeCoalescer::new(WINDOW);
        coalescer.push(PathBuf::from("/a"), start);

        assert!(
            coalescer
                .take_ready(start + Duration::from_millis(40))
                .is_empty()
        );
        assert_eq!(
            coalescer.time_until_ready(start + Duration::from_millis(40)),
            Some(Duration::from_millis(60))
        );
        assert_eq!(
            coalescer.take_ready(start + WINDOW),
            vec![PathBuf::from("/a")]
        );
    }

    #[test]
    fn merges_repeated_changes_of_the_same_folder() {
        let start = Instant::now();
        let mut coalescer = ChangeCoalescer::new(WINDOW);
        coalescer.push(PathBuf::from("/a"), start);
        coalescer.push(PathBuf::from("/b"), start + Duration::from_millis(10));
        coalescer.push(PathBuf::from("/a"), start + Duration::from_millis(20));

        assert_eq!(
            coalescer.take_ready(start + WINDOW),
            vec![PathBuf::from("/a"), PathBuf::from("/b")]
        );
    }

    #[test]
    fn starts_a_new_window_after_flushing() {
        let start = Instant::now();
        let mut coalescer = ChangeCoalescer::new(WINDOW);
        coalescer.push(PathBuf::from("/a"), start);
        coalescer.take_ready(start + WINDOW);

        let later = start + Duration::from_secs(1);
        coalescer.push(PathBuf::from("/a"), later);

        assert!(
            coalescer
                .take_ready(later + Duration::from_millis(10))
                .is_empty()
        );
        assert_eq!(
            coalescer.take_ready(later + WINDOW),
            vec![PathBuf::from("/a")]
        );
    }
}
