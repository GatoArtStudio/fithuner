#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub enum SearchKindFilter {
    #[default]
    All,
    Folders,
    Files,
    Images,
    Documents,
    Audio,
    Video,
    Archives,
    Code,
}
