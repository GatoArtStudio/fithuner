use serde::{Deserialize, Serialize};

use crate::domains::file_clipboard::domain::{ClipboardError, ClipboardFiles, ClipboardIntent};

#[derive(Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ClipboardIntentDto {
    Copy,
    Cut,
}

impl From<ClipboardIntentDto> for ClipboardIntent {
    fn from(intent: ClipboardIntentDto) -> Self {
        match intent {
            ClipboardIntentDto::Copy => ClipboardIntent::Copy,
            ClipboardIntentDto::Cut => ClipboardIntent::Cut,
        }
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClipboardFilesDto {
    paths: Vec<String>,
    intent: &'static str,
}

impl From<ClipboardFiles> for ClipboardFilesDto {
    fn from(files: ClipboardFiles) -> Self {
        Self {
            paths: files
                .paths
                .into_iter()
                .map(|path| path.to_string_lossy().into_owned())
                .collect(),
            intent: match files.intent {
                ClipboardIntent::Copy => "copy",
                ClipboardIntent::Cut => "cut",
            },
        }
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClipboardErrorDto {
    kind: &'static str,
    message: String,
}

impl From<ClipboardError> for ClipboardErrorDto {
    fn from(error: ClipboardError) -> Self {
        Self {
            kind: "unavailable",
            message: error.to_string(),
        }
    }
}
