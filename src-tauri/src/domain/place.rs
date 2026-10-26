use std::path::PathBuf;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PlaceKind {
    Home,
    Desktop,
    Documents,
    Downloads,
    Pictures,
    Music,
    Videos,
    Drive,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Place {
    pub label: String,
    pub path: PathBuf,
    pub kind: PlaceKind,
}
