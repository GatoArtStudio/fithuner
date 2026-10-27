use std::sync::Mutex;

use crate::domains::app_updates::application::ports::{
    ApplicationRestarterPort, ExternalLinkOpenerPort, UpdateSourcePort,
};
use crate::domains::app_updates::domain::{AppUpdateError, DownloadProgress, UpdateCheckResult};

pub struct FakeUpdateSource {
    pub check_result: Result<UpdateCheckResult, AppUpdateError>,
    pub progress_to_report: Vec<DownloadProgress>,
    pub download_error: Option<AppUpdateError>,
    pub install_error: Option<AppUpdateError>,
    pub calls: Mutex<Vec<&'static str>>,
}

impl FakeUpdateSource {
    pub fn checking(check_result: Result<UpdateCheckResult, AppUpdateError>) -> Self {
        Self {
            check_result,
            progress_to_report: Vec::new(),
            download_error: None,
            install_error: None,
            calls: Mutex::default(),
        }
    }

    pub fn recorded_calls(&self) -> Vec<&'static str> {
        self.calls.lock().unwrap().clone()
    }
}

impl UpdateSourcePort for FakeUpdateSource {
    fn check(&self) -> Result<UpdateCheckResult, AppUpdateError> {
        self.calls.lock().unwrap().push("check");
        self.check_result.clone()
    }

    fn download(
        &self,
        on_progress: &mut dyn FnMut(DownloadProgress),
    ) -> Result<(), AppUpdateError> {
        self.calls.lock().unwrap().push("download");
        for progress in &self.progress_to_report {
            on_progress(*progress);
        }
        self.download_error.clone().map_or(Ok(()), Err)
    }

    fn install_downloaded(&self) -> Result<(), AppUpdateError> {
        self.calls.lock().unwrap().push("install");
        self.install_error.clone().map_or(Ok(()), Err)
    }
}

#[derive(Default)]
pub struct FakeRestarter {
    pub restarts: Mutex<u32>,
}

impl ApplicationRestarterPort for FakeRestarter {
    fn restart(&self) {
        *self.restarts.lock().unwrap() += 1;
    }
}

#[derive(Default)]
pub struct FakeLinkOpener {
    pub opened: Mutex<Vec<String>>,
}

impl ExternalLinkOpenerPort for FakeLinkOpener {
    fn open(&self, url: &str) -> Result<(), AppUpdateError> {
        self.opened.lock().unwrap().push(url.to_owned());
        Ok(())
    }
}
