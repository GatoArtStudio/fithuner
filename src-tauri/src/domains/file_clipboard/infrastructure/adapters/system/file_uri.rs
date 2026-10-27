#[cfg(target_os = "linux")]
use std::path::Path;
use std::path::PathBuf;

const FILE_URI_PREFIX: &str = "file://";

pub fn file_uri_to_path(entry: &str) -> PathBuf {
    let trimmed = entry.trim();
    let Some(without_scheme) = trimmed.strip_prefix(FILE_URI_PREFIX) else {
        return PathBuf::from(trimmed);
    };

    let without_host = if without_scheme.starts_with('/') {
        without_scheme
    } else {
        without_scheme
            .find('/')
            .map_or("", |slash_index| &without_scheme[slash_index..])
    };
    let is_windows_drive = without_host
        .strip_prefix('/')
        .and_then(|rest| rest.as_bytes().get(..2))
        .is_some_and(|prefix| prefix[0].is_ascii_alphabetic() && prefix[1] == b':');
    let path_part = if is_windows_drive {
        &without_host[1..]
    } else {
        without_host
    };

    PathBuf::from(percent_decode(path_part))
}

fn percent_decode(text: &str) -> String {
    let bytes = text.as_bytes();
    let mut decoded = Vec::with_capacity(bytes.len());
    let mut index = 0;
    while index < bytes.len() {
        let hex_value = (bytes[index] == b'%')
            .then(|| bytes.get(index + 1..index + 3))
            .flatten()
            .and_then(|hex| std::str::from_utf8(hex).ok())
            .and_then(|hex| u8::from_str_radix(hex, 16).ok());
        match hex_value {
            Some(byte) => {
                decoded.push(byte);
                index += 3;
            }
            None => {
                decoded.push(bytes[index]);
                index += 1;
            }
        }
    }
    String::from_utf8_lossy(&decoded).into_owned()
}

#[cfg(target_os = "linux")]
pub fn path_to_file_uri(path: &Path) -> String {
    use std::os::unix::ffi::OsStrExt;

    let mut uri = String::from(FILE_URI_PREFIX);
    for &byte in path.as_os_str().as_bytes() {
        if byte.is_ascii_alphanumeric() || matches!(byte, b'/' | b'-' | b'_' | b'.' | b'~') {
            uri.push(byte as char);
        } else {
            uri.push_str(&format!("%{byte:02X}"));
        }
    }
    uri
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn plain_paths_are_returned_unchanged() {
        assert_eq!(
            file_uri_to_path("/home/user/a.txt"),
            PathBuf::from("/home/user/a.txt")
        );
        assert_eq!(
            file_uri_to_path("C:\\Users\\me\\a.txt"),
            PathBuf::from("C:\\Users\\me\\a.txt")
        );
    }

    #[test]
    fn decodes_posix_file_uris() {
        assert_eq!(
            file_uri_to_path("file:///home/user/My%20Docs/%C3%B1.txt"),
            PathBuf::from("/home/user/My Docs/ñ.txt")
        );
    }

    #[test]
    fn decodes_windows_file_uris() {
        assert_eq!(
            file_uri_to_path("file:///C:/Users/me/a%20b.txt"),
            PathBuf::from("C:/Users/me/a b.txt")
        );
    }

    #[test]
    fn ignores_the_host_part_of_a_file_uri() {
        assert_eq!(
            file_uri_to_path("file://localhost/tmp/a.txt"),
            PathBuf::from("/tmp/a.txt")
        );
    }

    #[test]
    fn keeps_invalid_percent_sequences_as_they_are() {
        assert_eq!(
            file_uri_to_path("file:///tmp/100%/a"),
            PathBuf::from("/tmp/100%/a")
        );
    }

    #[cfg(target_os = "linux")]
    #[test]
    fn encodes_special_characters_and_round_trips() {
        let path = Path::new("/home/user/My Docs/ñ #1.txt");

        let uri = path_to_file_uri(path);

        assert_eq!(uri, "file:///home/user/My%20Docs/%C3%B1%20%231.txt");
        assert_eq!(file_uri_to_path(&uri), path);
    }
}
