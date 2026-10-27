use std::sync::Arc;

use crate::domains::app_updates::application::ports::{DownloadUpdateUseCase, UpdateSourcePort};
use crate::domains::app_updates::domain::{AppUpdateError, DownloadProgress};

pub struct DownloadUpdate {
    update_source: Arc<dyn UpdateSourcePort>,
}

impl DownloadUpdate {
    pub fn new(update_source: Arc<dyn UpdateSourcePort>) -> Self {
        Self { update_source }
    }
}

impl DownloadUpdateUseCase for DownloadUpdate {
    fn execute(&self, on_progress: &mut dyn FnMut(DownloadProgress)) -> Result<(), AppUpdateError> {
        self.update_source.download(on_progress)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domains::app_updates::application::use_cases::fake_ports::FakeUpdateSource;
    use crate::domains::app_updates::domain::UpdateCheckResult;

    fn source() -> FakeUpdateSource {
        FakeUpdateSource::checking(Ok(UpdateCheckResult {
            current_version: "0.1.0".into(),
            available: None,
        }))
    }

    #[test]
    fn forwards_every_progress_report_in_order() {
        let mut source = source();
        source.progress_to_report = vec![
            DownloadProgress {
                downloaded_bytes: 10,
                total_bytes: Some(100),
            },
            DownloadProgress {
                downloaded_bytes: 100,
                total_bytes: Some(100),
            },
        ];
        let mut received = Vec::new();

        DownloadUpdate::new(Arc::new(source))
            .execute(&mut |progress| received.push(progress.downloaded_bytes))
            .unwrap();

        assert_eq!(received, vec![10, 100]);
    }

    #[test]
    fn fails_when_there_is_nothing_to_download() {
        let mut source = source();
        source.download_error = Some(AppUpdateError::NoUpdateAvailable);

        let error = DownloadUpdate::new(Arc::new(source))
            .execute(&mut |_| {})
            .unwrap_err();

        assert_eq!(error, AppUpdateError::NoUpdateAvailable);
    }

    #[test]
    fn reports_a_signature_that_does_not_match() {
        let mut source = source();
        source.download_error = Some(AppUpdateError::InvalidSignature);

        let error = DownloadUpdate::new(Arc::new(source))
            .execute(&mut |_| {})
            .unwrap_err();

        assert_eq!(error, AppUpdateError::InvalidSignature);
    }
}
