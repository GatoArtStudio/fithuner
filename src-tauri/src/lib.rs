mod domains;
mod interface;

use std::sync::Arc;

use domains::directory_browsing::application::{ListDirectory, ListDirectoryUseCase};
use domains::directory_browsing::infrastructure::StdFileSystem;
use domains::places::application::{ListPlaces, ListPlacesUseCase};
use domains::places::infrastructure::OsPlacesProvider;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let list_directory: Arc<dyn ListDirectoryUseCase> =
        Arc::new(ListDirectory::new(Arc::new(StdFileSystem)));
    let list_places: Arc<dyn ListPlacesUseCase> =
        Arc::new(ListPlaces::new(Arc::new(OsPlacesProvider)));

    ::tauri::Builder::default()
        .manage(list_directory)
        .manage(list_places)
        .invoke_handler(::tauri::generate_handler![
            interface::tauri::directory_browsing::commands::list_directory,
            interface::tauri::places::commands::list_places
        ])
        .run(::tauri::generate_context!())
        .expect("error while running tauri application");
}
