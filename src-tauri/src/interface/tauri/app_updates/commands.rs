use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;
use std::time::{Duration, Instant};

use tauri::{AppHandle, Emitter, State};

use super::dtos::{
    AppUpdateErrorDto, DownloadFinishedDto, DownloadProgressDto, UpdateCheckResultDto,
};
use crate::domains::app_updates::application::{
    CheckForUpdateUseCase, DownloadUpdateUseCase, InstallUpdateUseCase, OpenReleasePageUseCase,
};

pub const DOWNLOAD_PROGRESS_EVENT: &str = "update-download-progress";
pub const DOWNLOAD_FINISHED_EVENT: &str = "update-download-finished";
const MIN_PROGRESS_INTERVAL: Duration = Duration::from_millis(100);

#[derive(Default)]
pub struct DownloadInProgress(AtomicBool);

#[tauri::command(async)]
pub fn check_for_update(
    use_case: State<'_, Arc<dyn CheckForUpdateUseCase>>,
) -> Result<UpdateCheckResultDto, AppUpdateErrorDto> {
    use_case.execute().map(Into::into).map_err(Into::into)
}

#[tauri::command]
pub fn download_update(
    app: AppHandle,
    use_case: State<'_, Arc<dyn DownloadUpdateUseCase>>,
    in_progress: State<'_, Arc<DownloadInProgress>>,
) {
    if in_progress.0.swap(true, Ordering::SeqCst) {
        return;
    }
    let use_case = use_case.inner().clone();
    let in_progress = in_progress.inner().clone();

    thread::spawn(move || {
        let mut last_emitted_at: Option<Instant> = None;
        let result = use_case.execute(&mut |progress| {
            let is_due =
                last_emitted_at.is_none_or(|instant| instant.elapsed() >= MIN_PROGRESS_INTERVAL);
            if is_due {
                last_emitted_at = Some(Instant::now());
                let _ = app.emit(DOWNLOAD_PROGRESS_EVENT, DownloadProgressDto::from(progress));
            }
        });

        in_progress.0.store(false, Ordering::SeqCst);
        let _ = app.emit(
            DOWNLOAD_FINISHED_EVENT,
            DownloadFinishedDto::from_result(result),
        );
    });
}

#[tauri::command(async)]
pub fn install_update_and_restart(
    use_case: State<'_, Arc<dyn InstallUpdateUseCase>>,
) -> Result<(), AppUpdateErrorDto> {
    use_case.execute().map_err(Into::into)
}

#[tauri::command(async)]
pub fn open_release_page(
    use_case: State<'_, Arc<dyn OpenReleasePageUseCase>>,
) -> Result<(), AppUpdateErrorDto> {
    use_case.execute().map_err(Into::into)
}
