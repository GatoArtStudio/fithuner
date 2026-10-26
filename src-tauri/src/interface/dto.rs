use serde::Serialize;

use crate::domain::{
    DirectoryListing, FileEntry, FileEntryKind, FileSystemError, Place, PlaceKind,
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
pub struct PlaceDto {
    label: String,
    path: String,
    kind: &'static str,
}

impl From<Place> for PlaceDto {
    fn from(place: Place) -> Self {
        Self {
            label: place.label,
            path: place.path.to_string_lossy().into_owned(),
            kind: match place.kind {
                PlaceKind::Home => "home",
                PlaceKind::Desktop => "desktop",
                PlaceKind::Documents => "documents",
                PlaceKind::Downloads => "downloads",
                PlaceKind::Pictures => "pictures",
                PlaceKind::Music => "music",
                PlaceKind::Videos => "videos",
                PlaceKind::Drive => "drive",
            },
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
