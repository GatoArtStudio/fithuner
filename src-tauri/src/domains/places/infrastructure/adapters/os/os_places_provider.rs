use std::path::PathBuf;

use crate::domains::places::application::PlacesProviderPort;
use crate::domains::places::domain::{Place, PlaceKind};

pub struct OsPlacesProvider;

impl PlacesProviderPort for OsPlacesProvider {
    fn available_places(&self) -> Vec<Place> {
        let user_places = [
            ("Home", dirs::home_dir(), PlaceKind::Home),
            ("Desktop", dirs::desktop_dir(), PlaceKind::Desktop),
            ("Documents", dirs::document_dir(), PlaceKind::Documents),
            ("Downloads", dirs::download_dir(), PlaceKind::Downloads),
            ("Pictures", dirs::picture_dir(), PlaceKind::Pictures),
            ("Music", dirs::audio_dir(), PlaceKind::Music),
            ("Videos", dirs::video_dir(), PlaceKind::Videos),
        ];

        user_places
            .into_iter()
            .filter_map(|(label, path, kind)| {
                let path = path.filter(|path| path.is_dir())?;
                Some(Place {
                    label: label.into(),
                    path,
                    kind,
                })
            })
            .chain(drive_places())
            .collect()
    }
}

#[cfg(windows)]
fn drive_places() -> Vec<Place> {
    ('A'..='Z')
        .map(|letter| PathBuf::from(format!("{letter}:\\")))
        .filter(|path| path.is_dir())
        .map(|path| Place {
            label: path.display().to_string(),
            path,
            kind: PlaceKind::Drive,
        })
        .collect()
}

#[cfg(not(windows))]
fn drive_places() -> Vec<Place> {
    vec![Place {
        label: "File System".into(),
        path: PathBuf::from("/"),
        kind: PlaceKind::Drive,
    }]
}
