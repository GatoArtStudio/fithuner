use tauri::AppHandle;

use crate::domains::app_updates::application::ApplicationRestarterPort;

pub struct TauriApplicationRestarter {
    app: AppHandle,
}

impl TauriApplicationRestarter {
    pub fn new(app: AppHandle) -> Self {
        Self { app }
    }
}

impl ApplicationRestarterPort for TauriApplicationRestarter {
    fn restart(&self) {
        self.app.restart()
    }
}
