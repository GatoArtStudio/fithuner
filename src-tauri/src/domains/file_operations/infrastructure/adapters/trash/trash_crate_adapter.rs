use std::path::{Path, PathBuf};

use crate::domains::file_operations::application::TrashPort;
use crate::domains::file_operations::domain::FileOperationError;

pub struct TrashCrateAdapter;

/// Index of the most recently deleted item among those that were deleted from `original`.
fn latest_deleted_from(items: &[(PathBuf, i64)], original: &Path) -> Option<usize> {
    items
        .iter()
        .enumerate()
        .filter(|(_, (path, _))| path == original)
        .max_by_key(|(_, (_, deleted_at))| *deleted_at)
        .map(|(index, _)| index)
}

impl TrashPort for TrashCrateAdapter {
    fn move_to_trash(&self, path: &Path) -> Result<(), FileOperationError> {
        if std::fs::symlink_metadata(path).is_err() {
            return Err(FileOperationError::NotFound);
        }
        trash::delete(path).map_err(|error| FileOperationError::Unexpected(error.to_string()))
    }

    #[cfg(any(
        target_os = "windows",
        all(
            unix,
            not(target_os = "macos"),
            not(target_os = "ios"),
            not(target_os = "android")
        )
    ))]
    fn restore(&self, path: &Path) -> Result<(), FileOperationError> {
        let mut items = trash::os_limited::list()
            .map_err(|error| FileOperationError::Unexpected(error.to_string()))?;
        let candidates: Vec<(PathBuf, i64)> = items
            .iter()
            .map(|item| (item.original_path(), item.time_deleted))
            .collect();
        let index = latest_deleted_from(&candidates, path).ok_or(FileOperationError::NotFound)?;

        trash::os_limited::restore_all([items.swap_remove(index)]).map_err(|error| match error {
            trash::Error::RestoreCollision { .. } => FileOperationError::AlreadyExists,
            other => FileOperationError::Unexpected(other.to_string()),
        })
    }

    #[cfg(not(any(
        target_os = "windows",
        all(
            unix,
            not(target_os = "macos"),
            not(target_os = "ios"),
            not(target_os = "android")
        )
    )))]
    fn restore(&self, _path: &Path) -> Result<(), FileOperationError> {
        Err(FileOperationError::Unsupported(
            "Restoring from the trash is not supported on this system yet".into(),
        ))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn item(path: &str, deleted_at: i64) -> (PathBuf, i64) {
        (PathBuf::from(path), deleted_at)
    }

    #[test]
    fn picks_the_most_recently_deleted_item_for_a_path() {
        let items = [
            item("/a/x.txt", 10),
            item("/a/y.txt", 50),
            item("/a/x.txt", 30),
        ];

        assert_eq!(latest_deleted_from(&items, Path::new("/a/x.txt")), Some(2));
    }

    #[test]
    fn finds_nothing_for_a_path_that_was_never_trashed() {
        let items = [item("/a/x.txt", 10)];

        assert_eq!(latest_deleted_from(&items, Path::new("/a/other.txt")), None);
        assert_eq!(latest_deleted_from(&[], Path::new("/a/x.txt")), None);
    }
}
