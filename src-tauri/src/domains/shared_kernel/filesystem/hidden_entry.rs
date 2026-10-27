use std::fs::Metadata;

#[cfg(windows)]
pub fn is_hidden_entry(name: &str, metadata: &Metadata) -> bool {
    use std::os::windows::fs::MetadataExt;
    const FILE_ATTRIBUTE_HIDDEN: u32 = 0x2;
    name.starts_with('.') || metadata.file_attributes() & FILE_ATTRIBUTE_HIDDEN != 0
}

#[cfg(not(windows))]
pub fn is_hidden_entry(name: &str, _metadata: &Metadata) -> bool {
    name.starts_with('.')
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn names_starting_with_a_dot_are_hidden() {
        let directory = tempfile::tempdir().unwrap();
        let hidden = directory.path().join(".secret");
        let visible = directory.path().join("report.txt");
        std::fs::write(&hidden, "").unwrap();
        std::fs::write(&visible, "").unwrap();

        assert!(is_hidden_entry(
            ".secret",
            &std::fs::metadata(&hidden).unwrap()
        ));
        assert!(!is_hidden_entry(
            "report.txt",
            &std::fs::metadata(&visible).unwrap()
        ));
    }
}
