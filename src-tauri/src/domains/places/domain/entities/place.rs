use std::path::PathBuf;

use crate::domains::places::domain::PlaceKind;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Place {
    pub label: String,
    pub path: PathBuf,
    pub kind: PlaceKind,
}
