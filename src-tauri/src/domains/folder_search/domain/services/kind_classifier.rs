use crate::domains::folder_search::domain::{EntryKind, SearchKindFilter};

const IMAGES: &[&str] = &[
    "png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico", "avif", "tiff", "heic",
];
const DOCUMENTS: &[&str] = &[
    "pdf", "doc", "docx", "odt", "rtf", "txt", "md", "xls", "xlsx", "ods", "csv", "ppt", "pptx",
    "odp",
];
const AUDIO: &[&str] = &[
    "mp3", "wav", "flac", "ogg", "oga", "m4a", "aac", "opus", "wma",
];
const VIDEO: &[&str] = &["mp4", "mkv", "webm", "mov", "avi", "wmv", "m4v", "flv"];
const ARCHIVES: &[&str] = &["zip", "tar", "gz", "bz2", "xz", "7z", "rar", "zst", "tgz"];
const CODE: &[&str] = &[
    "rs", "ts", "tsx", "js", "jsx", "py", "go", "java", "kt", "c", "h", "cpp", "hpp", "cs", "php",
    "rb", "sh", "sql", "json", "yaml", "yml", "toml", "html", "css", "scss", "vue", "lua", "swift",
    "dart",
];

pub struct KindClassifier;

impl KindClassifier {
    pub fn accepts(filter: SearchKindFilter, kind: EntryKind, name: &str) -> bool {
        match filter {
            SearchKindFilter::All => true,
            SearchKindFilter::Folders => kind == EntryKind::Directory,
            SearchKindFilter::Files => kind == EntryKind::File,
            SearchKindFilter::Images => Self::is_file_with(kind, name, IMAGES),
            SearchKindFilter::Documents => Self::is_file_with(kind, name, DOCUMENTS),
            SearchKindFilter::Audio => Self::is_file_with(kind, name, AUDIO),
            SearchKindFilter::Video => Self::is_file_with(kind, name, VIDEO),
            SearchKindFilter::Archives => Self::is_file_with(kind, name, ARCHIVES),
            SearchKindFilter::Code => Self::is_file_with(kind, name, CODE),
        }
    }

    fn is_file_with(kind: EntryKind, name: &str, extensions: &[&str]) -> bool {
        kind == EntryKind::File
            && name
                .rsplit_once('.')
                .filter(|(stem, _)| !stem.is_empty())
                .is_some_and(|(_, extension)| {
                    extensions.contains(&extension.to_lowercase().as_str())
                })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn all_accepts_files_and_folders() {
        assert!(KindClassifier::accepts(
            SearchKindFilter::All,
            EntryKind::Directory,
            "x"
        ));
        assert!(KindClassifier::accepts(
            SearchKindFilter::All,
            EntryKind::File,
            "x"
        ));
    }

    #[test]
    fn folders_and_files_filters_split_by_kind() {
        assert!(KindClassifier::accepts(
            SearchKindFilter::Folders,
            EntryKind::Directory,
            "photos"
        ));
        assert!(!KindClassifier::accepts(
            SearchKindFilter::Folders,
            EntryKind::File,
            "a.txt"
        ));
        assert!(KindClassifier::accepts(
            SearchKindFilter::Files,
            EntryKind::File,
            "a.txt"
        ));
        assert!(!KindClassifier::accepts(
            SearchKindFilter::Files,
            EntryKind::Directory,
            "photos"
        ));
    }

    #[test]
    fn media_filters_use_the_extension_without_caring_about_case() {
        assert!(KindClassifier::accepts(
            SearchKindFilter::Images,
            EntryKind::File,
            "Holiday.JPG"
        ));
        assert!(KindClassifier::accepts(
            SearchKindFilter::Audio,
            EntryKind::File,
            "song.flac"
        ));
        assert!(KindClassifier::accepts(
            SearchKindFilter::Video,
            EntryKind::File,
            "clip.mkv"
        ));
        assert!(!KindClassifier::accepts(
            SearchKindFilter::Images,
            EntryKind::File,
            "song.flac"
        ));
    }

    #[test]
    fn document_archive_and_code_filters() {
        assert!(KindClassifier::accepts(
            SearchKindFilter::Documents,
            EntryKind::File,
            "report.pdf"
        ));
        assert!(KindClassifier::accepts(
            SearchKindFilter::Archives,
            EntryKind::File,
            "backup.tar"
        ));
        assert!(KindClassifier::accepts(
            SearchKindFilter::Code,
            EntryKind::File,
            "main.rs"
        ));
    }

    #[test]
    fn typed_filters_never_accept_folders_even_when_named_like_files() {
        assert!(!KindClassifier::accepts(
            SearchKindFilter::Images,
            EntryKind::Directory,
            "pictures.png"
        ));
    }

    #[test]
    fn files_without_an_extension_or_dotfiles_only_match_generic_filters() {
        assert!(!KindClassifier::accepts(
            SearchKindFilter::Code,
            EntryKind::File,
            "Makefile"
        ));
        assert!(!KindClassifier::accepts(
            SearchKindFilter::Code,
            EntryKind::File,
            ".rs"
        ));
        assert!(KindClassifier::accepts(
            SearchKindFilter::Files,
            EntryKind::File,
            "Makefile"
        ));
    }
}
