use std::sync::Arc;

use crate::domains::app_updates::application::ports::{CheckForUpdateUseCase, UpdateSourcePort};
use crate::domains::app_updates::domain::{AppUpdateError, UpdateCheckResult};

pub struct CheckForUpdate {
    update_source: Arc<dyn UpdateSourcePort>,
}

impl CheckForUpdate {
    pub fn new(update_source: Arc<dyn UpdateSourcePort>) -> Self {
        Self { update_source }
    }
}

impl CheckForUpdateUseCase for CheckForUpdate {
    fn execute(&self) -> Result<UpdateCheckResult, AppUpdateError> {
        self.update_source.check()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domains::app_updates::application::use_cases::fake_ports::FakeUpdateSource;
    use crate::domains::app_updates::domain::AvailableUpdate;

    #[test]
    fn reports_an_available_update_with_its_notes() {
        let result = UpdateCheckResult {
            current_version: "0.1.0".into(),
            available: Some(AvailableUpdate {
                version: "0.2.0".into(),
                notes: Some("Faster previews".into()),
                published_at_millis: Some(1_700_000_000_000),
            }),
        };

        let checked = CheckForUpdate::new(Arc::new(FakeUpdateSource::checking(Ok(result.clone()))))
            .execute()
            .unwrap();

        assert_eq!(checked, result);
    }

    #[test]
    fn reports_when_the_app_is_up_to_date() {
        let result = UpdateCheckResult {
            current_version: "0.1.0".into(),
            available: None,
        };

        let checked = CheckForUpdate::new(Arc::new(FakeUpdateSource::checking(Ok(result))))
            .execute()
            .unwrap();

        assert_eq!(checked.available, None);
    }

    #[test]
    fn propagates_network_failures() {
        let source = FakeUpdateSource::checking(Err(AppUpdateError::Network("offline".into())));

        let error = CheckForUpdate::new(Arc::new(source)).execute().unwrap_err();

        assert_eq!(error, AppUpdateError::Network("offline".into()));
    }
}
