use crate::domains::places::domain::Place;

pub trait PlacesProviderPort: Send + Sync {
    fn available_places(&self) -> Vec<Place>;
}
