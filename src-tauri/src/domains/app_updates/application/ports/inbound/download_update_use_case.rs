use crate::domains::app_updates::domain::{AppUpdateError, DownloadProgress};

pub trait DownloadUpdateUseCase: Send + Sync {
    fn execute(&self, on_progress: &mut dyn FnMut(DownloadProgress)) -> Result<(), AppUpdateError>;
}
