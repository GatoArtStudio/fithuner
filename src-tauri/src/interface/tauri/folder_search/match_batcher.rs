use std::time::{Duration, Instant};

const MAX_BATCH_SIZE: usize = 100;
const MAX_BATCH_AGE: Duration = Duration::from_millis(100);

/// Groups search matches so the frontend receives a few events per second instead of one per match.
pub struct MatchBatcher<Item> {
    items: Vec<Item>,
    first_item_at: Option<Instant>,
}

impl<Item> MatchBatcher<Item> {
    pub fn new() -> Self {
        Self {
            items: Vec::new(),
            first_item_at: None,
        }
    }

    pub fn push(&mut self, item: Item, now: Instant) -> Option<Vec<Item>> {
        self.first_item_at.get_or_insert(now);
        self.items.push(item);

        let is_full = self.items.len() >= MAX_BATCH_SIZE;
        let is_old = self
            .first_item_at
            .is_some_and(|first| now.duration_since(first) >= MAX_BATCH_AGE);
        (is_full || is_old).then(|| self.take())
    }

    pub fn take(&mut self) -> Vec<Item> {
        self.first_item_at = None;
        std::mem::take(&mut self.items)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn holds_items_until_the_batch_is_full() {
        let now = Instant::now();
        let mut batcher = MatchBatcher::new();

        for index in 0..MAX_BATCH_SIZE - 1 {
            assert_eq!(batcher.push(index, now), None);
        }
        let batch = batcher.push(99, now).unwrap();

        assert_eq!(batch.len(), MAX_BATCH_SIZE);
    }

    #[test]
    fn flushes_a_small_batch_once_it_is_old_enough() {
        let start = Instant::now();
        let mut batcher = MatchBatcher::new();

        assert_eq!(batcher.push("a", start), None);
        let batch = batcher.push("b", start + MAX_BATCH_AGE).unwrap();

        assert_eq!(batch, vec!["a", "b"]);
    }

    #[test]
    fn take_returns_the_leftovers_and_starts_a_new_batch() {
        let start = Instant::now();
        let mut batcher = MatchBatcher::new();
        batcher.push("a", start);

        assert_eq!(batcher.take(), vec!["a"]);
        assert!(batcher.take().is_empty());
        assert_eq!(batcher.push("b", start + MAX_BATCH_AGE * 5), None);
    }
}
