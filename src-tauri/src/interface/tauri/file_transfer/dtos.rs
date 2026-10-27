use serde::{Deserialize, Serialize};

use crate::domains::file_transfer::domain::{
    ConflictDecision, ConflictResolution, EntryInfo, EntryKind, FileTransferError,
    TransferConflict, TransferMode, TransferOutcome, TransferProgress,
};

#[derive(Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TransferModeDto {
    Copy,
    Move,
}

impl From<TransferModeDto> for TransferMode {
    fn from(mode: TransferModeDto) -> Self {
        match mode {
            TransferModeDto::Copy => TransferMode::Copy,
            TransferModeDto::Move => TransferMode::Move,
        }
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TransferRequestDto {
    pub sources: Vec<String>,
    pub destination_directory: String,
    pub mode: TransferModeDto,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ConflictResolutionDto {
    Replace,
    Skip,
    KeepBoth,
    Cancel,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConflictDecisionDto {
    pub resolution: ConflictResolutionDto,
    pub apply_to_all: bool,
}

impl From<ConflictDecisionDto> for ConflictDecision {
    fn from(decision: ConflictDecisionDto) -> Self {
        Self {
            resolution: match decision.resolution {
                ConflictResolutionDto::Replace => ConflictResolution::Replace,
                ConflictResolutionDto::Skip => ConflictResolution::Skip,
                ConflictResolutionDto::KeepBoth => ConflictResolution::KeepBoth,
                ConflictResolutionDto::Cancel => ConflictResolution::Cancel,
            },
            apply_to_all: decision.apply_to_all,
        }
    }
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TransferProgressDto {
    pub transfer_id: String,
    bytes_done: u64,
    bytes_total: u64,
    files_done: u64,
    files_total: u64,
    current_path: String,
}

impl TransferProgressDto {
    pub fn new(transfer_id: &str, progress: &TransferProgress) -> Self {
        Self {
            transfer_id: transfer_id.to_owned(),
            bytes_done: progress.bytes_done,
            bytes_total: progress.bytes_total,
            files_done: progress.files_done,
            files_total: progress.files_total,
            current_path: progress.current_path.to_string_lossy().into_owned(),
        }
    }
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct EntryInfoDto {
    kind: &'static str,
    size_in_bytes: u64,
    modified_at_millis: Option<u64>,
}

impl From<EntryInfo> for EntryInfoDto {
    fn from(info: EntryInfo) -> Self {
        Self {
            kind: match info.kind {
                EntryKind::File => "file",
                EntryKind::Directory => "directory",
                EntryKind::Symlink => "symlink",
            },
            size_in_bytes: info.size_in_bytes,
            modified_at_millis: info.modified_at_millis,
        }
    }
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TransferConflictDto {
    transfer_id: String,
    source: String,
    target: String,
    source_info: EntryInfoDto,
    target_info: EntryInfoDto,
}

impl TransferConflictDto {
    pub fn new(transfer_id: &str, conflict: &TransferConflict) -> Self {
        Self {
            transfer_id: transfer_id.to_owned(),
            source: conflict.source.to_string_lossy().into_owned(),
            target: conflict.target.to_string_lossy().into_owned(),
            source_info: conflict.source_info.into(),
            target_info: conflict.target_info.into(),
        }
    }
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FailedTransferDto {
    path: String,
    message: String,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TransferFinishedDto {
    transfer_id: String,
    transferred_files: u64,
    skipped: Vec<String>,
    failed: Vec<FailedTransferDto>,
    cancelled: bool,
    error: Option<String>,
}

impl TransferFinishedDto {
    pub fn from_result(
        transfer_id: &str,
        result: Result<TransferOutcome, FileTransferError>,
    ) -> Self {
        match result {
            Ok(outcome) => Self {
                transfer_id: transfer_id.to_owned(),
                transferred_files: outcome.transferred_files,
                skipped: outcome
                    .skipped
                    .into_iter()
                    .map(|path| path.to_string_lossy().into_owned())
                    .collect(),
                failed: outcome
                    .failed
                    .into_iter()
                    .map(|(path, error)| FailedTransferDto {
                        path: path.to_string_lossy().into_owned(),
                        message: error.to_string(),
                    })
                    .collect(),
                cancelled: outcome.cancelled,
                error: None,
            },
            Err(error) => Self {
                transfer_id: transfer_id.to_owned(),
                transferred_files: 0,
                skipped: Vec::new(),
                failed: Vec::new(),
                cancelled: false,
                error: Some(error.to_string()),
            },
        }
    }
}
