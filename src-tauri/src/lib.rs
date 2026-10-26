mod domains;
mod interface;

use std::sync::Arc;

use domains::directory_browsing::application::ListDirectory;
use domains::directory_browsing::infrastructure::StdFileSystem;
use domains::places::application::ListPlaces;
use domains::places::infrastructure::OsPlacesProvider;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(ListDirectory::new(Arc::new(StdFileSystem)))
        .manage(ListPlaces::new(Arc::new(OsPlacesProvider)))
        .invoke_handler(tauri::generate_handler![
            interface::directory_browsing::list_directory,
            interface::places::list_places
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
