use crate::domains::places::domain::Place;

pub trait ListPlacesUseCase: Send + Sync {
    fn execute(&self) -> Vec<Place>;
}
