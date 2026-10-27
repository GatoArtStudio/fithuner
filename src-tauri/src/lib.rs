mod domains;
mod interface;

use std::sync::Arc;

use ::tauri::{Emitter, Manager};

use domains::app_updates::application::{
    CheckForUpdate, CheckForUpdateUseCase, DownloadUpdate, DownloadUpdateUseCase, InstallUpdate,
    InstallUpdateUseCase, OpenReleasePage, OpenReleasePageUseCase,
};
use domains::app_updates::infrastructure::{
    SystemLinkOpener, TauriApplicationRestarter, TauriUpdateSource,
};
use domains::directory_browsing::application::{ListDirectory, ListDirectoryUseCase};
use domains::directory_browsing::infrastructure::StdFileSystem;
use domains::file_clipboard::application::{
    ClearCutMarker, ClearCutMarkerUseCase, PlaceFilesOnClipboard, PlaceFilesOnClipboardUseCase,
    ReadClipboardFiles, ReadClipboardFilesUseCase,
};
use domains::file_clipboard::infrastructure::{ClipboardRsAdapter, InMemoryCutMarker};
use domains::file_operations::application::{
    CreateEntry, CreateEntryUseCase, DeleteEntriesPermanently, DeleteEntriesPermanentlyUseCase,
    MoveEntries, MoveEntriesUseCase, OpenEntry, OpenEntryUseCase, RenameEntry, RenameEntryUseCase,
    RestoreEntries, RestoreEntriesUseCase, TrashEntries, TrashEntriesUseCase,
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
use domains::folder_search::application::{SearchFolder, SearchFolderUseCase};
use domains::folder_search::infrastructure::StdFolderWalker;
use domains::folder_watching::application::{
    FolderWatcherPort, UpdateWatchedFolders, UpdateWatchedFoldersUseCase,
};
use domains::folder_watching::infrastructure::{NoopFolderWatcher, NotifyFolderWatcher};
use domains::places::application::{ListPlaces, ListPlacesUseCase};
use domains::places::infrastructure::OsPlacesProvider;
use domains::settings::application::{
    LoadSettings, LoadSettingsUseCase, SaveSettings, SaveSettingsUseCase,
};
use domains::settings::infrastructure::JsonSettingsRepository;
use interface::tauri::app_updates::commands::DownloadInProgress;
use interface::tauri::folder_watching::commands::FOLDER_CHANGED_EVENT;
use interface::tauri::folder_watching::dtos::FolderChangedDto;

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
    let trash_adapter = Arc::new(TrashCrateAdapter);
    let trash_entries: Arc<dyn TrashEntriesUseCase> =
        Arc::new(TrashEntries::new(trash_adapter.clone()));
    let restore_entries: Arc<dyn RestoreEntriesUseCase> =
        Arc::new(RestoreEntries::new(trash_adapter));
    let move_entries: Arc<dyn MoveEntriesUseCase> =
        Arc::new(MoveEntries::new(entry_writer.clone()));
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

    let search_folder: Arc<dyn SearchFolderUseCase> =
        Arc::new(SearchFolder::new(Arc::new(StdFolderWalker)));
    let search_sessions =
        Arc::new(interface::tauri::folder_search::sessions::SearchSessions::default());

    let builder = ::tauri::Builder::default()
        .setup(|app| {
            let update_source = Arc::new(TauriUpdateSource::new(app.handle().clone()));
            let restarter = Arc::new(TauriApplicationRestarter::new(app.handle().clone()));
            let check_for_update: Arc<dyn CheckForUpdateUseCase> =
                Arc::new(CheckForUpdate::new(update_source.clone()));
            let download_update: Arc<dyn DownloadUpdateUseCase> =
                Arc::new(DownloadUpdate::new(update_source.clone()));
            let install_update: Arc<dyn InstallUpdateUseCase> =
                Arc::new(InstallUpdate::new(update_source, restarter));
            let open_release_page: Arc<dyn OpenReleasePageUseCase> =
                Arc::new(OpenReleasePage::new(Arc::new(SystemLinkOpener)));

            let app_handle = app.handle().clone();
            let folder_watcher: Arc<dyn FolderWatcherPort> =
                match NotifyFolderWatcher::new(Arc::new(move |folder| {
                    let _ = app_handle.emit(
                        FOLDER_CHANGED_EVENT,
                        FolderChangedDto {
                            path: folder.to_string_lossy().into_owned(),
                        },
                    );
                })) {
                    Ok(watcher) => Arc::new(watcher),
                    Err(error) => {
                        log::warn!("Live folder updates are unavailable: {error}");
                        Arc::new(NoopFolderWatcher)
                    }
                };
            let update_watched_folders: Arc<dyn UpdateWatchedFoldersUseCase> =
                Arc::new(UpdateWatchedFolders::new(folder_watcher));

            app.manage(update_watched_folders);
            app.manage(check_for_update);
            app.manage(download_update);
            app.manage(install_update);
            app.manage(open_release_page);
            app.manage(Arc::new(DownloadInProgress::default()));
            Ok(())
        })
        .manage(list_directory)
        .manage(list_places)
        .manage(open_entry)
        .manage(create_entry)
        .manage(rename_entry)
        .manage(trash_entries)
        .manage(restore_entries)
        .manage(move_entries)
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
        .manage(search_folder)
        .manage(search_sessions);

    #[cfg(desktop)]
    let builder = builder.plugin(tauri_plugin_updater::Builder::new().build());

    builder
        .invoke_handler(::tauri::generate_handler![
            interface::tauri::directory_browsing::commands::list_directory,
            interface::tauri::places::commands::list_places,
            interface::tauri::file_operations::commands::open_entry,
            interface::tauri::file_operations::commands::create_entry,
            interface::tauri::file_operations::commands::rename_entry,
            interface::tauri::file_operations::commands::trash_entries,
            interface::tauri::file_operations::commands::delete_entries_permanently,
            interface::tauri::file_operations::commands::move_entries,
            interface::tauri::file_operations::commands::restore_entries,
            interface::tauri::file_transfer::commands::start_transfer,
            interface::tauri::file_transfer::commands::cancel_transfer,
            interface::tauri::file_transfer::commands::resolve_conflict,
            interface::tauri::file_clipboard::commands::copy_files_to_clipboard,
            interface::tauri::file_clipboard::commands::read_clipboard_files,
            interface::tauri::file_clipboard::commands::clear_cut_marker,
            interface::tauri::settings::commands::load_settings,
            interface::tauri::settings::commands::save_settings,
            interface::tauri::file_preview::commands::read_text_preview,
            interface::tauri::file_preview::commands::summarize_folder,
            interface::tauri::app_updates::commands::check_for_update,
            interface::tauri::app_updates::commands::download_update,
            interface::tauri::app_updates::commands::install_update_and_restart,
            interface::tauri::app_updates::commands::open_release_page,
            interface::tauri::folder_search::commands::start_search,
            interface::tauri::folder_search::commands::cancel_search,
            interface::tauri::folder_watching::commands::watch_folders
        ])
        .run(::tauri::generate_context!())
        .expect("error while running tauri application");
}
