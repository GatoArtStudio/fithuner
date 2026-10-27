mod domains;
mod interface;

use std::sync::Arc;

use domains::directory_browsing::application::{ListDirectory, ListDirectoryUseCase};
use domains::directory_browsing::infrastructure::StdFileSystem;
use domains::file_operations::application::{
    CreateEntry, CreateEntryUseCase, DeleteEntriesPermanently, DeleteEntriesPermanentlyUseCase,
    OpenEntry, OpenEntryUseCase, RenameEntry, RenameEntryUseCase, TrashEntries,
    TrashEntriesUseCase,
};
use domains::file_operations::infrastructure::{
    StdEntryWriter, SystemFileOpener, TrashCrateAdapter,
};
use domains::file_transfer::application::{TransferEntries, TransferEntriesUseCase};
use domains::file_transfer::infrastructure::StdTransferFileSystem;
use domains::places::application::{ListPlaces, ListPlacesUseCase};
use domains::places::infrastructure::OsPlacesProvider;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let entry_writer = Arc::new(StdEntryWriter);

    let list_directory: Arc<dyn ListDirectoryUseCase> =
        Arc::new(ListDirectory::new(Arc::new(StdFileSystem)));
    let list_places: Arc<dyn ListPlacesUseCase> =
        Arc::new(ListPlaces::new(Arc::new(OsPlacesProvider)));
    let open_entry: Arc<dyn OpenEntryUseCase> =
        Arc::new(OpenEntry::new(Arc::new(SystemFileOpener)));
    let create_entry: Arc<dyn CreateEntryUseCase> =
        Arc::new(CreateEntry::new(entry_writer.clone()));
    let rename_entry: Arc<dyn RenameEntryUseCase> =
        Arc::new(RenameEntry::new(entry_writer.clone()));
    let trash_entries: Arc<dyn TrashEntriesUseCase> =
        Arc::new(TrashEntries::new(Arc::new(TrashCrateAdapter)));
    let delete_entries_permanently: Arc<dyn DeleteEntriesPermanentlyUseCase> =
        Arc::new(DeleteEntriesPermanently::new(entry_writer));

    let transfer_entries: Arc<dyn TransferEntriesUseCase> =
        Arc::new(TransferEntries::new(Arc::new(StdTransferFileSystem)));
    let transfer_sessions =
        Arc::new(interface::tauri::file_transfer::sessions::TransferSessions::default());

    ::tauri::Builder::default()
        .manage(list_directory)
        .manage(list_places)
        .manage(open_entry)
        .manage(create_entry)
        .manage(rename_entry)
        .manage(trash_entries)
        .manage(delete_entries_permanently)
        .manage(transfer_entries)
        .manage(transfer_sessions)
        .invoke_handler(::tauri::generate_handler![
            interface::tauri::directory_browsing::commands::list_directory,
            interface::tauri::places::commands::list_places,
            interface::tauri::file_operations::commands::open_entry,
            interface::tauri::file_operations::commands::create_entry,
            interface::tauri::file_operations::commands::rename_entry,
            interface::tauri::file_operations::commands::trash_entries,
            interface::tauri::file_operations::commands::delete_entries_permanently,
            interface::tauri::file_transfer::commands::start_transfer,
            interface::tauri::file_transfer::commands::cancel_transfer,
            interface::tauri::file_transfer::commands::resolve_conflict
        ])
        .run(::tauri::generate_context!())
        .expect("error while running tauri application");
}
