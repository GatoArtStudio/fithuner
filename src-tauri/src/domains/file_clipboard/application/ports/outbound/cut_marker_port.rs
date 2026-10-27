use std::path::PathBuf;

pub trait CutMarkerPort: Send + Sync {
    fn mark_as_cut(&self, paths: &[PathBuf]);
    fn marked_paths(&self) -> Vec<PathBuf>;
    fn clear(&self);
}
