use crate::domains::app_updates::domain::AppUpdateError;

pub trait OpenReleasePageUseCase: Send + Sync {
    fn execute(&self) -> Result<(), AppUpdateError>;
}
