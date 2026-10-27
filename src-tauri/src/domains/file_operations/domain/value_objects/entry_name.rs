use crate::domains::file_operations::domain::FileOperationError;

const MAX_NAME_BYTES: usize = 255;
const FORBIDDEN_CHARACTERS: [char; 9] = ['/', '\\', '<', '>', ':', '"', '|', '?', '*'];

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EntryName(String);

impl EntryName {
    pub fn parse(raw_name: &str) -> Result<Self, FileOperationError> {
        let rejection = if raw_name.trim().is_empty() {
            Some("the name cannot be empty")
        } else if raw_name == "." || raw_name == ".." {
            Some("the name cannot be \".\" or \"..\"")
        } else if raw_name.len() > MAX_NAME_BYTES {
            Some("the name is too long")
        } else if raw_name.chars().any(|character| character.is_control()) {
            Some("the name cannot contain control characters")
        } else if raw_name.contains(FORBIDDEN_CHARACTERS) {
            Some("the name cannot contain / \\ < > : \" | ? *")
        } else if raw_name.ends_with('.') || raw_name.ends_with(' ') {
            Some("the name cannot end with a dot or a space")
        } else {
            None
        };

        match rejection {
            Some(reason) => Err(FileOperationError::InvalidName(reason.into())),
            None => Ok(Self(raw_name.to_owned())),
        }
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_regular_names() {
        for name in [
            "notes.txt",
            ".gitignore",
            "My folder",
            "archive (2).zip",
            "ñandú",
        ] {
            assert_eq!(EntryName::parse(name).unwrap().as_str(), name);
        }
    }

    #[test]
    fn rejects_invalid_names() {
        let invalid_names = [
            "",
            "   ",
            ".",
            "..",
            "a/b",
            "a\\b",
            "what?",
            "star*",
            "pipe|name",
            "tab\tname",
            "ends.",
            "ends ",
        ];
        for name in invalid_names {
            assert!(
                matches!(
                    EntryName::parse(name),
                    Err(FileOperationError::InvalidName(_))
                ),
                "{name:?} should be rejected"
            );
        }
    }

    #[test]
    fn rejects_names_longer_than_255_bytes() {
        assert!(EntryName::parse(&"a".repeat(256)).is_err());
        assert!(EntryName::parse(&"a".repeat(255)).is_ok());
    }
}
