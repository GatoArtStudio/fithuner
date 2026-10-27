use std::path::PathBuf;
use std::sync::Arc;

use crate::domains::file_clipboard::application::ports::{
    CutMarkerPort, PlaceFilesOnClipboardUseCase, SystemClipboardPort,
};
use crate::domains::file_clipboard::domain::{ClipboardError, ClipboardIntent};

pub struct PlaceFilesOnClipboard {
    system_clipboard: Arc<dyn SystemClipboardPort>,
    cut_marker: Arc<dyn CutMarkerPort>,
}

impl PlaceFilesOnClipboard {
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

impl PlaceFilesOnClipboardUseCase for PlaceFilesOnClipboard {
    fn execute(&self, paths: Vec<PathBuf>, intent: ClipboardIntent) -> Result<(), ClipboardError> {
        self.system_clipboard.write_files(&paths)?;
        match intent {
            ClipboardIntent::Cut => self.cut_marker.mark_as_cut(&paths),
            ClipboardIntent::Copy => self.cut_marker.clear(),
        }
        Ok(())
    }
}
