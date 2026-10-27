use std::sync::Arc;

use crate::domains::app_updates::application::ports::{
    ApplicationRestarterPort, InstallUpdateUseCase, UpdateSourcePort,
};
use crate::domains::app_updates::domain::AppUpdateError;

pub struct InstallUpdate {
    update_source: Arc<dyn UpdateSourcePort>,
    restarter: Arc<dyn ApplicationRestarterPort>,
}

impl InstallUpdate {
    pub fn new(
        update_source: Arc<dyn UpdateSourcePort>,
        restarter: Arc<dyn ApplicationRestarterPort>,
    ) -> Self {
        Self {
            update_source,
            restarter,
        }
    }
}

impl InstallUpdateUseCase for InstallUpdate {
    fn execute(&self) -> Result<(), AppUpdateError> {
        self.update_source.install_downloaded()?;
        self.restarter.restart();
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domains::app_updates::application::use_cases::fake_ports::{
        FakeRestarter, FakeUpdateSource,
    };
    use crate::domains::app_updates::domain::UpdateCheckResult;

    fn source() -> FakeUpdateSource {
        FakeUpdateSource::checking(Ok(UpdateCheckResult {
            current_version: "0.1.0".into(),
            available: None,
        }))
    }

    #[test]
    fn installs_and_then_restarts() {
        let source = Arc::new(source());
        let restarter = Arc::new(FakeRestarter::default());

        InstallUpdate::new(source.clone(), restarter.clone())
            .execute()
            .unwrap();

        assert_eq!(source.recorded_calls(), vec!["install"]);
        assert_eq!(*restarter.restarts.lock().unwrap(), 1);
    }

    #[test]
    fn does_not_restart_when_the_installation_fails() {
        let mut failing = source();
        failing.install_error = Some(AppUpdateError::NothingDownloaded);
        let restarter = Arc::new(FakeRestarter::default());

        let error = InstallUpdate::new(Arc::new(failing), restarter.clone())
            .execute()
            .unwrap_err();

        assert_eq!(error, AppUpdateError::NothingDownloaded);
        assert_eq!(*restarter.restarts.lock().unwrap(), 0);
    }
}
