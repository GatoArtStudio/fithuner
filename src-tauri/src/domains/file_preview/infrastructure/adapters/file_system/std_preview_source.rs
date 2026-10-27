use std::fs::{self, File};
use std::io::{self, Read};
use std::path::{Path, PathBuf};
use std::time::Instant;

use crate::domains::file_preview::application::PreviewSourcePort;
use crate::domains::file_preview::domain::{
    FileHead, FilePreviewError, FolderSummary, FolderWalkLimits,
};

pub struct StdPreviewSource;

impl PreviewSourcePort for StdPreviewSource {
    fn read_head(&self, path: &Path, limit_bytes: u64) -> Result<FileHead, FilePreviewError> {
        let metadata = fs::metadata(path).map_err(map_io_error)?;
        if !metadata.is_file() {
            return Err(FilePreviewError::NotAFile);
        }

        let mut bytes = Vec::new();
        File::open(path)
            .map_err(map_io_error)?
            .take(limit_bytes)
            .read_to_end(&mut bytes)
            .map_err(map_io_error)?;

        Ok(FileHead {
            bytes,
            total_bytes: metadata.len(),
        })
    }

    fn walk_folder(
        &self,
        path: &Path,
        limits: &FolderWalkLimits,
    ) -> Result<FolderSummary, FilePreviewError> {
        if !fs::metadata(path).map_err(map_io_error)?.is_dir() {
            return Err(FilePreviewError::NotADirectory);
        }

        let started_at = Instant::now();
        let mut summary = FolderSummary::default();
        let mut visited_entries = 0u64;
        let mut pending: Vec<PathBuf> = vec![path.to_path_buf()];

        while let Some(directory) = pending.pop() {
            let Ok(children) = fs::read_dir(&directory) else {
                summary.is_partial = true;
                continue;
            };
            for child in children.filter_map(Result::ok) {
                if visited_entries >= limits.max_entries
                    || started_at.elapsed() >= limits.max_duration
                {
                    summary.is_partial = true;
                    return Ok(summary);
                }
                visited_entries += 1;

                let Ok(metadata) = fs::symlink_metadata(child.path()) else {
                    continue;
                };
                if metadata.is_dir() {
                    summary.folder_count += 1;
                    pending.push(child.path());
                } else {
                    summary.file_count += 1;
                    summary.total_bytes += metadata.len();
                }
            }
        }
        Ok(summary)
    }
}

fn map_io_error(error: io::Error) -> FilePreviewError {
    match error.kind() {
        io::ErrorKind::NotFound => FilePreviewError::NotFound,
        io::ErrorKind::PermissionDenied => FilePreviewError::PermissionDenied,
        _ => FilePreviewError::Unexpected(error.to_string()),
    }
}

#[cfg(test)]
mod tests {
    use std::time::Duration;

    use super::*;

    #[test]
    fn reads_only_the_requested_head_and_reports_the_full_size() {
        let directory = tempfile::tempdir().unwrap();
        let path = directory.path().join("long.txt");
        fs::write(&path, "0123456789").unwrap();

        let head = StdPreviewSource.read_head(&path, 4).unwrap();

        assert_eq!(head.bytes, b"0123");
        assert_eq!(head.total_bytes, 10);
    }

    #[test]
    fn an_empty_file_has_an_empty_head() {
        let directory = tempfile::tempdir().unwrap();
        let path = directory.path().join("empty.txt");
        fs::write(&path, "").unwrap();

        let head = StdPreviewSource.read_head(&path, 100).unwrap();

        assert!(head.bytes.is_empty());
        assert_eq!(head.total_bytes, 0);
    }

    #[test]
    fn rejects_directories_and_missing_files() {
        let directory = tempfile::tempdir().unwrap();

        assert_eq!(
            StdPreviewSource
                .read_head(directory.path(), 10)
                .unwrap_err(),
            FilePreviewError::NotAFile
        );
        assert_eq!(
            StdPreviewSource
                .read_head(&directory.path().join("missing"), 10)
                .unwrap_err(),
            FilePreviewError::NotFound
        );
    }

    #[test]
    fn summarizes_nested_folders() {
        let directory = tempfile::tempdir().unwrap();
        fs::create_dir_all(directory.path().join("a").join("b")).unwrap();
        fs::write(directory.path().join("one.txt"), "12345").unwrap();
        fs::write(directory.path().join("a").join("two.txt"), "123").unwrap();
        fs::write(directory.path().join("a").join("b").join("three.txt"), "1").unwrap();

        let summary = StdPreviewSource
            .walk_folder(directory.path(), &FolderWalkLimits::default())
            .unwrap();

        assert_eq!(
            summary,
            FolderSummary {
                file_count: 3,
                folder_count: 2,
                total_bytes: 9,
                is_partial: false,
            }
        );
    }

    #[test]
    fn stops_and_marks_the_summary_as_partial_when_the_entry_limit_is_hit() {
        let directory = tempfile::tempdir().unwrap();
        for index in 0..10 {
            fs::write(directory.path().join(format!("file-{index}.txt")), "x").unwrap();
        }
        let limits = FolderWalkLimits {
            max_entries: 4,
            max_duration: Duration::from_secs(5),
        };

        let summary = StdPreviewSource
            .walk_folder(directory.path(), &limits)
            .unwrap();

        assert!(summary.is_partial);
        assert_eq!(summary.file_count, 4);
    }

    #[cfg(unix)]
    #[test]
    fn does_not_follow_symlinks_into_loops() {
        let directory = tempfile::tempdir().unwrap();
        fs::create_dir(directory.path().join("real")).unwrap();
        std::os::unix::fs::symlink(directory.path(), directory.path().join("real").join("loop"))
            .unwrap();

        let summary = StdPreviewSource
            .walk_folder(directory.path(), &FolderWalkLimits::default())
            .unwrap();

        assert!(!summary.is_partial);
        assert_eq!(summary.folder_count, 1);
        assert_eq!(summary.file_count, 1);
    }

    #[test]
    fn rejects_a_file_as_a_folder() {
        let directory = tempfile::tempdir().unwrap();
        let path = directory.path().join("file.txt");
        fs::write(&path, "x").unwrap();

        assert_eq!(
            StdPreviewSource
                .walk_folder(&path, &FolderWalkLimits::default())
                .unwrap_err(),
            FilePreviewError::NotADirectory
        );
    }
}
