use std::path::PathBuf;

use serde::{Deserialize, Serialize};

use crate::domains::file_operations::domain::{BatchOutcome, FileOperationError, NewEntryKind};

#[derive(Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum NewEntryKindDto {
    File,
    Directory,
}

impl From<NewEntryKindDto> for NewEntryKind {
    fn from(kind: NewEntryKindDto) -> Self {
        match kind {
            NewEntryKindDto::File => NewEntryKind::File,
            NewEntryKindDto::Directory => NewEntryKind::Directory,
        }
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileOperationErrorDto {
    kind: &'static str,
    message: String,
}

impl From<FileOperationError> for FileOperationErrorDto {
    fn from(error: FileOperationError) -> Self {
        Self {
            kind: match error {
                FileOperationError::AlreadyExists => "alreadyExists",
                FileOperationError::NotFound => "notFound",
                FileOperationError::PermissionDenied => "permissionDenied",
                FileOperationError::InvalidName(_) => "invalidName",
                FileOperationError::Unexpected(_) => "unexpected",
            },
            message: error.to_string(),
        }
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FailedEntryDto {
    path: String,
    error: FileOperationErrorDto,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchOutcomeDto {
    succeeded: Vec<String>,
    failed: Vec<FailedEntryDto>,
}

fn path_to_string(path: PathBuf) -> String {
    path.to_string_lossy().into_owned()
}

impl From<BatchOutcome> for BatchOutcomeDto {
    fn from(outcome: BatchOutcome) -> Self {
        Self {
            succeeded: outcome.succeeded.into_iter().map(path_to_string).collect(),
            failed: outcome
                .failed
                .into_iter()
                .map(|(path, error)| FailedEntryDto {
                    path: path_to_string(path),
                    error: error.into(),
                })
                .collect(),
        }
    }
}
