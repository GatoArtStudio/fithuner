mod domains;
mod interface;

use std::sync::Arc;

use domains::directory_browsing::application::{ListDirectory, ListDirectoryUseCase};
use domains::directory_browsing::infrastructure::StdFileSystem;
use domains::file_clipboard::application::{
    ClearCutMarker, ClearCutMarkerUseCase, PlaceFilesOnClipboard, PlaceFilesOnClipboardUseCase,
    ReadClipboardFiles, ReadClipboardFilesUseCase,
};
use domains::file_clipboard::infrastructure::{ClipboardRsAdapter, InMemoryCutMarker};
use domains::file_operations::application::{
    CreateEntry, CreateEntryUseCase, DeleteEntriesPermanently, DeleteEntriesPermanentlyUseCase,
    OpenEntry, OpenEntryUseCase, RenameEntry, RenameEntryUseCase, TrashEntries,
    TrashEntriesUseCase,
};
use domains::file_operations::infrastructure::{
    StdEntryWriter, SystemFileOpener, TrashCrateAdapter,
};
use domains::file_preview::application::{
    ReadTextPreview, ReadTextPreviewUseCase, SummarizeFolder, SummarizeFolderUseCase,
};
use domains::file_preview::infrastructure::StdPreviewSource;
use domains::file_transfer::application::{TransferEntries, TransferEntriesUseCase};
use domains::file_transfer::infrastructure::StdTransferFileSystem;
use domains::places::application::{ListPlaces, ListPlacesUseCase};
use domains::places::infrastructure::OsPlacesProvider;
use domains::settings::application::{
    LoadSettings, LoadSettingsUseCase, SaveSettings, SaveSettingsUseCase,
};
use domains::settings::infrastructure::JsonSettingsRepository;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let _ = env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("warn"))
        .try_init();

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

    let system_clipboard = Arc::new(ClipboardRsAdapter::new());
    let cut_marker = Arc::new(InMemoryCutMarker::default());
    let place_files_on_clipboard: Arc<dyn PlaceFilesOnClipboardUseCase> = Arc::new(
        PlaceFilesOnClipboard::new(system_clipboard.clone(), cut_marker.clone()),
    );
    let read_clipboard_files: Arc<dyn ReadClipboardFilesUseCase> = Arc::new(
        ReadClipboardFiles::new(system_clipboard, cut_marker.clone()),
    );
    let clear_cut_marker: Arc<dyn ClearCutMarkerUseCase> =
        Arc::new(ClearCutMarker::new(cut_marker));

    let settings_path = dirs::config_dir()
        .unwrap_or_else(std::env::temp_dir)
        .join("fithuner")
        .join("settings.json");
    let settings_repository = Arc::new(JsonSettingsRepository::new(settings_path));
    let load_settings: Arc<dyn LoadSettingsUseCase> =
        Arc::new(LoadSettings::new(settings_repository.clone()));
    let save_settings: Arc<dyn SaveSettingsUseCase> =
        Arc::new(SaveSettings::new(settings_repository));

    let preview_source = Arc::new(StdPreviewSource);
    let read_text_preview: Arc<dyn ReadTextPreviewUseCase> =
        Arc::new(ReadTextPreview::new(preview_source.clone()));
    let summarize_folder: Arc<dyn SummarizeFolderUseCase> =
        Arc::new(SummarizeFolder::new(preview_source));

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
        .manage(place_files_on_clipboard)
        .manage(read_clipboard_files)
        .manage(clear_cut_marker)
        .manage(load_settings)
        .manage(save_settings)
        .manage(read_text_preview)
        .manage(summarize_folder)
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
            interface::tauri::file_transfer::commands::resolve_conflict,
            interface::tauri::file_clipboard::commands::copy_files_to_clipboard,
            interface::tauri::file_clipboard::commands::read_clipboard_files,
            interface::tauri::file_clipboard::commands::clear_cut_marker,
            interface::tauri::settings::commands::load_settings,
            interface::tauri::settings::commands::save_settings,
            interface::tauri::file_preview::commands::read_text_preview,
            interface::tauri::file_preview::commands::summarize_folder
        ])
        .run(::tauri::generate_context!())
        .expect("error while running tauri application");
}
