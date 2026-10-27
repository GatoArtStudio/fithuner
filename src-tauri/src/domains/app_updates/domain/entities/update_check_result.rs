use crate::domains::app_updates::domain::AvailableUpdate;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UpdateCheckResult {
    pub current_version: String,
    pub available: Option<AvailableUpdate>,
}
