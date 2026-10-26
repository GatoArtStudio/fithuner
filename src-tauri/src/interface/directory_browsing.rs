use std::path::PathBuf;

use serde::Serialize;
use tauri::State;

use crate::domains::directory_browsing::application::ListDirectory;
use crate::domains::directory_browsing::domain::{
    DirectoryListing, FileEntry, FileEntryKind, FileSystemError,
};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileEntryDto {
    name: String,
    path: String,
    kind: &'static str,
    is_symlink: bool,
    is_hidden: bool,
    size_in_bytes: u64,
    modified_at_millis: Option<u64>,
}

impl From<FileEntry> for FileEntryDto {
    fn from(entry: FileEntry) -> Self {
        Self {
            name: entry.name,
            path: entry.path.to_string_lossy().into_owned(),
            kind: match entry.kind {
                FileEntryKind::File => "file",
                FileEntryKind::Directory => "directory",
            },
            is_symlink: entry.is_symlink,
            is_hidden: entry.is_hidden,
            size_in_bytes: entry.size_in_bytes,
            modified_at_millis: entry.modified_at_millis,
        }
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DirectoryListingDto {
    path: String,
    parent_path: Option<String>,
    entries: Vec<FileEntryDto>,
}

impl From<DirectoryListing> for DirectoryListingDto {
    fn from(listing: DirectoryListing) -> Self {
        Self {
            path: listing.path.to_string_lossy().into_owned(),
            parent_path: listing
                .parent_path
                .map(|path| path.to_string_lossy().into_owned()),
            entries: listing.entries.into_iter().map(Into::into).collect(),
        }
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommandErrorDto {
    kind: &'static str,
    message: String,
}

impl From<FileSystemError> for CommandErrorDto {
    fn from(error: FileSystemError) -> Self {
        Self {
            kind: match error {
                FileSystemError::NotFound => "notFound",
                FileSystemError::PermissionDenied => "permissionDenied",
                FileSystemError::NotADirectory => "notADirectory",
                FileSystemError::Unexpected(_) => "unexpected",
            },
            message: error.to_string(),
        }
    }
}

#[tauri::command]
pub fn list_directory(
    use_case: State<'_, ListDirectory>,
    path: Option<String>,
) -> Result<DirectoryListingDto, CommandErrorDto> {
    use_case
        .execute(path.map(PathBuf::from))
        .map(Into::into)
        .map_err(Into::into)
}
