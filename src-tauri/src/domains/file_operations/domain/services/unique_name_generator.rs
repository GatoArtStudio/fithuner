use crate::domains::file_operations::domain::NewEntryKind;

const DEFAULT_DIRECTORY_NAME: &str = "New folder";
const DEFAULT_FILE_NAME: &str = "New file.txt";

pub struct UniqueNameGenerator;

impl UniqueNameGenerator {
    pub fn generate(kind: NewEntryKind, existing_names: &[String]) -> String {
        let base_name = match kind {
            NewEntryKind::Directory => DEFAULT_DIRECTORY_NAME,
            NewEntryKind::File => DEFAULT_FILE_NAME,
        };
        let (stem, extension) = match (kind, base_name.rfind('.')) {
            (NewEntryKind::File, Some(dot_index)) => base_name.split_at(dot_index),
            _ => (base_name, ""),
        };

        let is_taken = |candidate: &str| {
            existing_names
                .iter()
                .any(|name| name.eq_ignore_ascii_case(candidate))
        };

        if !is_taken(base_name) {
            return base_name.to_owned();
        }
        (2..)
            .map(|number| format!("{stem} ({number}){extension}"))
            .find(|candidate| !is_taken(candidate))
            .expect("an unused numbered name always exists")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn names(values: &[&str]) -> Vec<String> {
        values.iter().map(|value| value.to_string()).collect()
    }

    #[test]
    fn uses_the_default_names_when_free() {
        assert_eq!(
            UniqueNameGenerator::generate(NewEntryKind::Directory, &[]),
            "New folder"
        );
        assert_eq!(
            UniqueNameGenerator::generate(NewEntryKind::File, &[]),
            "New file.txt"
        );
    }

    #[test]
    fn numbers_directories_after_collisions() {
        let existing = names(&["New folder", "New folder (2)"]);

        assert_eq!(
            UniqueNameGenerator::generate(NewEntryKind::Directory, &existing),
            "New folder (3)"
        );
    }

    #[test]
    fn keeps_the_extension_after_the_number() {
        let existing = names(&["New file.txt"]);

        assert_eq!(
            UniqueNameGenerator::generate(NewEntryKind::File, &existing),
            "New file (2).txt"
        );
    }

    #[test]
    fn ignores_case_when_checking_collisions() {
        let existing = names(&["new FOLDER"]);

        assert_eq!(
            UniqueNameGenerator::generate(NewEntryKind::Directory, &existing),
            "New folder (2)"
        );
    }
}
