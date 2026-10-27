use crate::domains::app_updates::domain::AppUpdateError;

pub trait InstallUpdateUseCase: Send + Sync {
    /// Installs the downloaded update and restarts the application.
    fn execute(&self) -> Result<(), AppUpdateError>;
}
