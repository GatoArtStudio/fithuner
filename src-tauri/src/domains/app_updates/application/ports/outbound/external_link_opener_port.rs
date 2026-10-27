use crate::domains::app_updates::domain::AppUpdateError;

pub trait ExternalLinkOpenerPort: Send + Sync {
    fn open(&self, url: &str) -> Result<(), AppUpdateError>;
}
