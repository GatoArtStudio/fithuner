use crate::domains::file_operations::domain::NewEntryKind;
use crate::domains::shared_kernel::naming::next_available_name;

const DEFAULT_DIRECTORY_NAME: &str = "New folder";
const DEFAULT_FILE_NAME: &str = "New file.txt";

pub struct UniqueNameGenerator;

impl UniqueNameGenerator {
    pub fn generate(kind: NewEntryKind, existing_names: &[String]) -> String {
        match kind {
            NewEntryKind::Directory => {
                next_available_name(DEFAULT_DIRECTORY_NAME, existing_names, false)
            }
            NewEntryKind::File => next_available_name(DEFAULT_FILE_NAME, existing_names, true),
        }
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
