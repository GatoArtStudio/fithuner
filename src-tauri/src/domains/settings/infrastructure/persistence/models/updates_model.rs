use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct UpdatesModel {
    pub check_on_startup: bool,
    pub auto_download: bool,
}

impl Default for UpdatesModel {
    fn default() -> Self {
        Self {
            check_on_startup: true,
            auto_download: false,
        }
    }
}
