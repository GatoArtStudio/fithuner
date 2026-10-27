use std::sync::Arc;

use crate::domains::file_clipboard::application::ports::{
    CutMarkerPort, ReadClipboardFilesUseCase, SystemClipboardPort, contains_same_paths,
};
use crate::domains::file_clipboard::domain::{ClipboardError, ClipboardFiles, ClipboardIntent};

pub struct ReadClipboardFiles {
    system_clipboard: Arc<dyn SystemClipboardPort>,
    cut_marker: Arc<dyn CutMarkerPort>,
}

impl ReadClipboardFiles {
    pub fn new(
        system_clipboard: Arc<dyn SystemClipboardPort>,
        cut_marker: Arc<dyn CutMarkerPort>,
    ) -> Self {
        Self {
            system_clipboard,
            cut_marker,
        }
    }
}

impl ReadClipboardFilesUseCase for ReadClipboardFiles {
    fn execute(&self) -> Result<ClipboardFiles, ClipboardError> {
        let paths = self.system_clipboard.read_files()?;
        let marked_paths = self.cut_marker.marked_paths();
        let intent = if !paths.is_empty() && contains_same_paths(&paths, &marked_paths) {
            ClipboardIntent::Cut
        } else {
            ClipboardIntent::Copy
        };
        Ok(ClipboardFiles { paths, intent })
    }
}

#[cfg(test)]
mod tests {
    use std::path::PathBuf;

    use super::*;
    use crate::domains::file_clipboard::application::ports::{
        ClearCutMarkerUseCase, PlaceFilesOnClipboardUseCase,
    };
    use crate::domains::file_clipboard::application::use_cases::PlaceFilesOnClipboard;
    use crate::domains::file_clipboard::application::use_cases::fake_ports::{
        FakeClipboard, FakeCutMarker,
    };

    fn setup() -> (
        PlaceFilesOnClipboard,
        ReadClipboardFiles,
        Arc<FakeClipboard>,
    ) {
        let clipboard = Arc::new(FakeClipboard::default());
        let marker = Arc::new(FakeCutMarker::default());
        (
            PlaceFilesOnClipboard::new(clipboard.clone(), marker.clone()),
            ReadClipboardFiles::new(clipboard.clone(), marker),
            clipboard,
        )
    }

    fn paths(values: &[&str]) -> Vec<PathBuf> {
        values.iter().map(PathBuf::from).collect()
    }

    #[test]
    fn reads_back_copied_files_as_a_copy() {
        let (place, read, _) = setup();
        place
            .execute(paths(&["/a.txt"]), ClipboardIntent::Copy)
            .unwrap();

        let files = read.execute().unwrap();

        assert_eq!(files.paths, paths(&["/a.txt"]));
        assert_eq!(files.intent, ClipboardIntent::Copy);
    }

    #[test]
    fn reads_back_cut_files_as_a_cut() {
        let (place, read, _) = setup();
        place
            .execute(paths(&["/a.txt", "/b.txt"]), ClipboardIntent::Cut)
            .unwrap();

        assert_eq!(read.execute().unwrap().intent, ClipboardIntent::Cut);
    }

    #[test]
    fn treats_files_copied_elsewhere_as_a_copy_even_after_a_cut() {
        let (place, read, clipboard) = setup();
        place
            .execute(paths(&["/a.txt"]), ClipboardIntent::Cut)
            .unwrap();
        clipboard.replace_with_foreign_files(&["/other.txt"]);

        assert_eq!(read.execute().unwrap().intent, ClipboardIntent::Copy);
    }

    #[test]
    fn a_later_copy_clears_the_cut_marker() {
        let (place, read, _) = setup();
        place
            .execute(paths(&["/a.txt"]), ClipboardIntent::Cut)
            .unwrap();
        place
            .execute(paths(&["/a.txt"]), ClipboardIntent::Copy)
            .unwrap();

        assert_eq!(read.execute().unwrap().intent, ClipboardIntent::Copy);
    }

    #[test]
    fn clearing_the_marker_turns_a_cut_into_a_copy() {
        let clipboard = Arc::new(FakeClipboard::default());
        let marker = Arc::new(FakeCutMarker::default());
        let place = PlaceFilesOnClipboard::new(clipboard.clone(), marker.clone());
        let read = ReadClipboardFiles::new(clipboard, marker.clone());
        place
            .execute(paths(&["/a.txt"]), ClipboardIntent::Cut)
            .unwrap();

        crate::domains::file_clipboard::application::use_cases::ClearCutMarker::new(marker)
            .execute();

        assert_eq!(read.execute().unwrap().intent, ClipboardIntent::Copy);
    }
}
