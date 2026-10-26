use serde::Serialize;
use tauri::State;

use crate::domains::places::application::ListPlaces;
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

#[tauri::command]
pub fn list_places(use_case: State<'_, ListPlaces>) -> Vec<PlaceDto> {
    use_case.execute().into_iter().map(Into::into).collect()
}
