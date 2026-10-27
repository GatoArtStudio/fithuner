use std::sync::Mutex;

use tauri::AppHandle;
use tauri::async_runtime::block_on;
use tauri_plugin_updater::{Update, Updater, UpdaterExt};

use super::update_error_mapper::map_updater_error;
use crate::domains::app_updates::application::UpdateSourcePort;
use crate::domains::app_updates::domain::{
    AppUpdateError, AvailableUpdate, DownloadProgress, UpdateCheckResult,
};

pub struct TauriUpdateSource {
    app: AppHandle,
    pending_update: Mutex<Option<Update>>,
    downloaded_bytes: Mutex<Option<Vec<u8>>>,
}

impl TauriUpdateSource {
    pub fn new(app: AppHandle) -> Self {
        Self {
            app,
            pending_update: Mutex::new(None),
            downloaded_bytes: Mutex::new(None),
        }
    }

    fn build_updater(&self) -> Result<Updater, AppUpdateError> {
        let mut builder = self.app.updater_builder();

        #[cfg(debug_assertions)]
        {
            if let Ok(endpoint) = std::env::var("FITHUNER_UPDATE_ENDPOINT") {
                let url = endpoint.parse().map_err(|_| {
                    AppUpdateError::Unexpected("invalid FITHUNER_UPDATE_ENDPOINT".into())
                })?;
                builder = builder.endpoints(vec![url]).map_err(map_updater_error)?;
            }
            if let Ok(public_key) = std::env::var("FITHUNER_UPDATE_PUBKEY") {
                builder = builder.pubkey(public_key);
            }
        }

        builder.build().map_err(map_updater_error)
    }
}

impl UpdateSourcePort for TauriUpdateSource {
    fn check(&self) -> Result<UpdateCheckResult, AppUpdateError> {
        let updater = self.build_updater()?;
        let current_version = self.app.package_info().version.to_string();
        let found = block_on(updater.check()).map_err(map_updater_error)?;

        *self.downloaded_bytes.lock().unwrap() = None;
        let available = found.as_ref().map(|update| AvailableUpdate {
            version: update.version.clone(),
            notes: update.body.clone().filter(|notes| !notes.trim().is_empty()),
            published_at_millis: update
                .date
                .and_then(|date| u64::try_from(date.unix_timestamp_nanos() / 1_000_000).ok()),
        });
        *self.pending_update.lock().unwrap() = found;

        Ok(UpdateCheckResult {
            current_version,
            available,
        })
    }

    fn download(
        &self,
        on_progress: &mut dyn FnMut(DownloadProgress),
    ) -> Result<(), AppUpdateError> {
        let update = self
            .pending_update
            .lock()
            .unwrap()
            .clone()
            .ok_or(AppUpdateError::NoUpdateAvailable)?;
        let mut downloaded_so_far = 0u64;

        let bytes = block_on(update.download(
            |chunk_length, total_bytes| {
                downloaded_so_far += chunk_length as u64;
                on_progress(DownloadProgress {
                    downloaded_bytes: downloaded_so_far,
                    total_bytes,
                });
            },
            || {},
        ))
        .map_err(map_updater_error)?;

        *self.downloaded_bytes.lock().unwrap() = Some(bytes);
        Ok(())
    }

    fn install_downloaded(&self) -> Result<(), AppUpdateError> {
        let update = self
            .pending_update
            .lock()
            .unwrap()
            .clone()
            .ok_or(AppUpdateError::NothingDownloaded)?;
        let bytes = self
            .downloaded_bytes
            .lock()
            .unwrap()
            .clone()
            .ok_or(AppUpdateError::NothingDownloaded)?;

        update.install(bytes).map_err(map_updater_error)
    }
}
