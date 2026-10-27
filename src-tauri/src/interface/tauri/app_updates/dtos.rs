use serde::Serialize;

use crate::domains::app_updates::domain::{
    AppUpdateError, AvailableUpdate, DownloadProgress, UpdateCheckResult,
};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AvailableUpdateDto {
    version: String,
    notes: Option<String>,
    published_at_millis: Option<u64>,
}

impl From<AvailableUpdate> for AvailableUpdateDto {
    fn from(update: AvailableUpdate) -> Self {
        Self {
            version: update.version,
            notes: update.notes,
            published_at_millis: update.published_at_millis,
        }
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCheckResultDto {
    current_version: String,
    available: Option<AvailableUpdateDto>,
}

impl From<UpdateCheckResult> for UpdateCheckResultDto {
    fn from(result: UpdateCheckResult) -> Self {
        Self {
            current_version: result.current_version,
            available: result.available.map(Into::into),
        }
    }
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DownloadProgressDto {
    downloaded_bytes: u64,
    total_bytes: Option<u64>,
}

impl From<DownloadProgress> for DownloadProgressDto {
    fn from(progress: DownloadProgress) -> Self {
        Self {
            downloaded_bytes: progress.downloaded_bytes,
            total_bytes: progress.total_bytes,
        }
    }
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AppUpdateErrorDto {
    kind: &'static str,
    message: String,
}

impl From<AppUpdateError> for AppUpdateErrorDto {
    fn from(error: AppUpdateError) -> Self {
        Self {
            kind: match error {
                AppUpdateError::NotConfigured => "notConfigured",
                AppUpdateError::Network(_) => "network",
                AppUpdateError::InvalidSignature => "invalidSignature",
                AppUpdateError::NotSupported => "notSupported",
                AppUpdateError::NoUpdateAvailable => "noUpdateAvailable",
                AppUpdateError::NothingDownloaded => "nothingDownloaded",
                AppUpdateError::Unexpected(_) => "unexpected",
            },
            message: error.to_string(),
        }
    }
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DownloadFinishedDto {
    error: Option<AppUpdateErrorDto>,
}

impl DownloadFinishedDto {
    pub fn from_result(result: Result<(), AppUpdateError>) -> Self {
        Self {
            error: result.err().map(Into::into),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn serializes_an_available_update_with_camel_case_names() {
        let dto = UpdateCheckResultDto::from(UpdateCheckResult {
            current_version: "0.1.0".into(),
            available: Some(AvailableUpdate {
                version: "0.2.0".into(),
                notes: None,
                published_at_millis: Some(5),
            }),
        });

        let json = serde_json::to_value(dto).unwrap();

        assert_eq!(json["currentVersion"], "0.1.0");
        assert_eq!(json["available"]["version"], "0.2.0");
        assert_eq!(json["available"]["publishedAtMillis"], 5);
    }

    #[test]
    fn names_every_error_kind_for_the_frontend() {
        let kinds: Vec<&str> = [
            AppUpdateError::NotConfigured,
            AppUpdateError::Network("x".into()),
            AppUpdateError::InvalidSignature,
            AppUpdateError::NotSupported,
            AppUpdateError::NoUpdateAvailable,
            AppUpdateError::NothingDownloaded,
            AppUpdateError::Unexpected("x".into()),
        ]
        .into_iter()
        .map(|error| AppUpdateErrorDto::from(error).kind)
        .collect();

        assert_eq!(
            kinds,
            [
                "notConfigured",
                "network",
                "invalidSignature",
                "notSupported",
                "noUpdateAvailable",
                "nothingDownloaded",
                "unexpected"
            ]
        );
    }

    #[test]
    fn a_successful_download_has_no_error() {
        let json = serde_json::to_value(DownloadFinishedDto::from_result(Ok(()))).unwrap();

        assert!(json["error"].is_null());
    }
}
