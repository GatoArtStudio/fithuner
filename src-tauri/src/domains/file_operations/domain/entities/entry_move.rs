use std::path::PathBuf;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EntryMove {
    pub from: PathBuf,
    pub to: PathBuf,
}
