use serde::Serialize;

use crate::domains::places::domain::{Place, PlaceKind};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PlaceDto {
    label: String,
    path: String,
    kind: &'static str,
}

impl From<Place> for PlaceDto {
    fn from(place: Place) -> Self {
        Self {
            label: place.label,
            path: place.path.to_string_lossy().into_owned(),
            kind: match place.kind {
                PlaceKind::Home => "home",
                PlaceKind::Desktop => "desktop",
                PlaceKind::Documents => "documents",
                PlaceKind::Downloads => "downloads",
                PlaceKind::Pictures => "pictures",
                PlaceKind::Music => "music",
                PlaceKind::Videos => "videos",
                PlaceKind::Drive => "drive",
            },
        }
    }
}
