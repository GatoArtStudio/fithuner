use crate::domains::app_updates::domain::{AppUpdateError, DownloadProgress, UpdateCheckResult};

pub trait UpdateSourcePort: Send + Sync {
    fn check(&self) -> Result<UpdateCheckResult, AppUpdateError>;

    /// Downloads the update found by the last check and keeps it ready to install.
    fn download(&self, on_progress: &mut dyn FnMut(DownloadProgress))
    -> Result<(), AppUpdateError>;

    fn install_downloaded(&self) -> Result<(), AppUpdateError>;
}
