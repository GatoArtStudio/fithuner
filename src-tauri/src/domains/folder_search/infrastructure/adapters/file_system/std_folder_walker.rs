use std::collections::VecDeque;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use std::time::UNIX_EPOCH;

use crate::domains::folder_search::application::FolderWalkerPort;
use crate::domains::folder_search::domain::{
    EntryKind, FolderSearchError, WalkControl, WalkedEntry,
};
use crate::domains::shared_kernel::filesystem::is_hidden_entry;

pub struct StdFolderWalker;

impl FolderWalkerPort for StdFolderWalker {
    fn walk(
        &self,
        root: &Path,
        include_hidden: bool,
        visitor: &mut dyn FnMut(WalkedEntry) -> WalkControl,
    ) -> Result<(), FolderSearchError> {
        if !fs::metadata(root).map_err(map_io_error)?.is_dir() {
            return Err(FolderSearchError::NotADirectory);
        }

        // Breadth first, so shallow matches reach the user before deep ones.
        let mut pending_folders: VecDeque<PathBuf> = VecDeque::from([root.to_path_buf()]);
        while let Some(folder) = pending_folders.pop_front() {
            let Ok(children) = fs::read_dir(&folder) else {
                continue;
            };
            for child in children.filter_map(Result::ok) {
                let path = child.path();
                let name = child.file_name().to_string_lossy().into_owned();
                let Ok(metadata) = fs::symlink_metadata(&path) else {
                    continue;
                };
                if !include_hidden && is_hidden_entry(&name, &metadata) {
                    continue;
                }

                let is_real_directory = metadata.is_dir();
                let entry = WalkedEntry {
                    kind: if is_real_directory {
                        EntryKind::Directory
                    } else {
                        EntryKind::File
                    },
                    size_in_bytes: if is_real_directory { 0 } else { metadata.len() },
                    modified_at_millis: metadata
                        .modified()
                        .ok()
                        .and_then(|modified| modified.duration_since(UNIX_EPOCH).ok())
                        .and_then(|elapsed| u64::try_from(elapsed.as_millis()).ok()),
                    path: path.clone(),
                    name,
                };
                if visitor(entry) == WalkControl::Stop {
                    return Ok(());
                }
                if is_real_directory {
                    pending_folders.push_back(path);
                }
            }
        }
        Ok(())
    }
}

fn map_io_error(error: io::Error) -> FolderSearchError {
    match error.kind() {
        io::ErrorKind::NotFound => FolderSearchError::NotFound,
        io::ErrorKind::PermissionDenied => FolderSearchError::PermissionDenied,
        _ => FolderSearchError::Unexpected(error.to_string()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn walk_names(root: &Path, include_hidden: bool) -> Vec<String> {
        let mut names = Vec::new();
        StdFolderWalker
            .walk(root, include_hidden, &mut |entry| {
                names.push(
                    entry
                        .path
                        .strip_prefix(root)
                        .unwrap()
                        .to_string_lossy()
                        .replace('\\', "/"),
                );
                WalkControl::Continue
            })
            .unwrap();
        names
    }

    #[test]
    fn visits_nested_entries_but_not_the_root_itself() {
        let directory = tempfile::tempdir().unwrap();
        fs::create_dir_all(directory.path().join("a").join("b")).unwrap();
        fs::write(directory.path().join("top.txt"), "x").unwrap();
        fs::write(directory.path().join("a").join("b").join("deep.txt"), "x").unwrap();

        let mut names = walk_names(directory.path(), false);
        names.sort();

        assert_eq!(names, vec!["a", "a/b", "a/b/deep.txt", "top.txt"]);
    }

    #[test]
    fn reports_shallow_entries_before_deep_ones() {
        let directory = tempfile::tempdir().unwrap();
        fs::create_dir_all(directory.path().join("one").join("two")).unwrap();
        fs::write(
            directory.path().join("one").join("two").join("deep.txt"),
            "x",
        )
        .unwrap();
        fs::write(directory.path().join("shallow.txt"), "x").unwrap();

        let names = walk_names(directory.path(), false);

        let position = |name: &str| {
            names
                .iter()
                .position(|candidate| candidate == name)
                .unwrap()
        };
        assert!(position("shallow.txt") < position("one/two/deep.txt"));
    }

    #[test]
    fn skips_hidden_entries_and_does_not_enter_hidden_folders_unless_asked() {
        let directory = tempfile::tempdir().unwrap();
        fs::create_dir(directory.path().join(".cache")).unwrap();
        fs::write(directory.path().join(".cache").join("inside.txt"), "x").unwrap();
        fs::write(directory.path().join(".env"), "x").unwrap();
        fs::write(directory.path().join("visible.txt"), "x").unwrap();

        assert_eq!(walk_names(directory.path(), false), vec!["visible.txt"]);
        assert_eq!(walk_names(directory.path(), true).len(), 4);
    }

    #[test]
    fn stops_as_soon_as_the_visitor_says_so() {
        let directory = tempfile::tempdir().unwrap();
        for index in 0..10 {
            fs::write(directory.path().join(format!("file-{index}.txt")), "x").unwrap();
        }
        let mut visited = 0;

        StdFolderWalker
            .walk(directory.path(), false, &mut |_| {
                visited += 1;
                if visited == 3 {
                    WalkControl::Stop
                } else {
                    WalkControl::Continue
                }
            })
            .unwrap();

        assert_eq!(visited, 3);
    }

    #[test]
    fn reports_sizes_and_kinds() {
        let directory = tempfile::tempdir().unwrap();
        fs::create_dir(directory.path().join("folder")).unwrap();
        fs::write(directory.path().join("data.bin"), "12345").unwrap();
        let mut entries = Vec::new();

        StdFolderWalker
            .walk(directory.path(), false, &mut |entry| {
                entries.push(entry);
                WalkControl::Continue
            })
            .unwrap();

        let file = entries
            .iter()
            .find(|entry| entry.name == "data.bin")
            .unwrap();
        let folder = entries.iter().find(|entry| entry.name == "folder").unwrap();
        assert_eq!((file.kind, file.size_in_bytes), (EntryKind::File, 5));
        assert_eq!(
            (folder.kind, folder.size_in_bytes),
            (EntryKind::Directory, 0)
        );
        assert!(file.modified_at_millis.is_some());
    }

    #[cfg(unix)]
    #[test]
    fn does_not_follow_symlinks_into_loops() {
        let directory = tempfile::tempdir().unwrap();
        fs::create_dir(directory.path().join("real")).unwrap();
        std::os::unix::fs::symlink(directory.path(), directory.path().join("real").join("loop"))
            .unwrap();

        let names = walk_names(directory.path(), false);

        assert_eq!(names, vec!["real", "real/loop"]);
    }

    #[test]
    fn rejects_missing_roots_and_files() {
        let directory = tempfile::tempdir().unwrap();
        let file = directory.path().join("file.txt");
        fs::write(&file, "x").unwrap();
        let ignore = |_: WalkedEntry| WalkControl::Continue;

        assert_eq!(
            StdFolderWalker
                .walk(&directory.path().join("missing"), false, &mut { ignore })
                .unwrap_err(),
            FolderSearchError::NotFound
        );
        assert_eq!(
            StdFolderWalker
                .walk(&file, false, &mut { ignore })
                .unwrap_err(),
            FolderSearchError::NotADirectory
        );
    }
}
