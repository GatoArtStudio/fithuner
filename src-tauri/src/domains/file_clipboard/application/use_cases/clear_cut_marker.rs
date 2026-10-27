use std::sync::Arc;

use crate::domains::file_clipboard::application::ports::{ClearCutMarkerUseCase, CutMarkerPort};

pub struct ClearCutMarker {
    cut_marker: Arc<dyn CutMarkerPort>,
}

impl ClearCutMarker {
    pub fn new(cut_marker: Arc<dyn CutMarkerPort>) -> Self {
        Self { cut_marker }
    }
}

impl ClearCutMarkerUseCase for ClearCutMarker {
    fn execute(&self) {
        self.cut_marker.clear();
    }
}
