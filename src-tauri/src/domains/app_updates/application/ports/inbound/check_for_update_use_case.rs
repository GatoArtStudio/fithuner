use crate::domains::app_updates::domain::{AppUpdateError, UpdateCheckResult};

pub trait CheckForUpdateUseCase: Send + Sync {
    fn execute(&self) -> Result<UpdateCheckResult, AppUpdateError>;
}
