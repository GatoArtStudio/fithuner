use std::sync::Arc;

use super::PlacesProviderPort;
use crate::domains::places::domain::Place;

pub struct ListPlaces {
    places_provider: Arc<dyn PlacesProviderPort>,
}

impl ListPlaces {
    pub fn new(places_provider: Arc<dyn PlacesProviderPort>) -> Self {
        Self { places_provider }
    }

    pub fn execute(&self) -> Vec<Place> {
        self.places_provider.available_places()
    }
}

#[cfg(test)]
mod tests {
    use std::path::PathBuf;

    use super::*;
    use crate::domains::places::domain::PlaceKind;

    struct FakePlacesProvider;

    impl PlacesProviderPort for FakePlacesProvider {
        fn available_places(&self) -> Vec<Place> {
            vec![Place {
                label: "Home".into(),
                path: PathBuf::from("/home/user"),
                kind: PlaceKind::Home,
            }]
        }
    }

    #[test]
    fn returns_the_places_offered_by_the_provider() {
        let places = ListPlaces::new(Arc::new(FakePlacesProvider)).execute();

        assert_eq!(places.len(), 1);
        assert_eq!(places[0].kind, PlaceKind::Home);
    }
}
