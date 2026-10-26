mod application;
mod domain;
mod infrastructure;
mod interface;

use std::sync::Arc;

use application::{ListDirectory, ListPlaces};
use infrastructure::{OsPlacesProvider, StdFileSystem};
use interface::AppUseCases;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let file_system = Arc::new(StdFileSystem);
    let places_provider = Arc::new(OsPlacesProvider);
    let use_cases = AppUseCases {
        list_directory: ListDirectory::new(file_system),
        list_places: ListPlaces::new(places_provider),
    };

    tauri::Builder::default()
        .manage(use_cases)
        .invoke_handler(tauri::generate_handler![
            interface::commands::list_directory,
            interface::commands::list_places
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
