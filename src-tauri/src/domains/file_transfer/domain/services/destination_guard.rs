use std::path::{Path, PathBuf};

use crate::domains::file_transfer::domain::FileTransferError;

pub struct DestinationGuard;

impl DestinationGuard {
    pub fn ensure_not_inside_sources(
        sources: &[PathBuf],
        destination_directory: &Path,
    ) -> Result<(), FileTransferError> {
        let is_inside_a_source = sources
            .iter()
            .any(|source| destination_directory.starts_with(source));

        if is_inside_a_source {
            return Err(FileTransferError::InvalidDestination(
                "a folder cannot be copied or moved into itself".into(),
            ));
        }
        Ok(())
    }

    pub fn is_already_in(source: &Path, destination_directory: &Path) -> bool {
        source.parent() == Some(destination_directory)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn paths(values: &[&str]) -> Vec<PathBuf> {
        values.iter().map(PathBuf::from).collect()
    }

    #[test]
    fn rejects_a_destination_inside_a_source_folder() {
        let result = DestinationGuard::ensure_not_inside_sources(
            &paths(&["/data/photos"]),
            Path::new("/data/photos/2024"),
        );

        assert!(matches!(
            result,
            Err(FileTransferError::InvalidDestination(_))
        ));
    }

    #[test]
    fn rejects_the_source_folder_itself_as_destination() {
        let result = DestinationGuard::ensure_not_inside_sources(
            &paths(&["/data/photos"]),
            Path::new("/data/photos"),
        );

        assert!(result.is_err());
    }

    #[test]
    fn accepts_sibling_folders_with_a_shared_name_prefix() {
        let result = DestinationGuard::ensure_not_inside_sources(
            &paths(&["/data/photos"]),
            Path::new("/data/photos-backup"),
        );

        assert!(result.is_ok());
    }

    #[test]
    fn detects_a_source_already_in_the_destination() {
        assert!(DestinationGuard::is_already_in(
            Path::new("/data/a.txt"),
            Path::new("/data")
        ));
        assert!(!DestinationGuard::is_already_in(
            Path::new("/data/sub/a.txt"),
            Path::new("/data")
        ));
    }
}
