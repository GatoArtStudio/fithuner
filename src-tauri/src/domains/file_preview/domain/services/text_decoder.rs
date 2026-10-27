pub struct TextDecoder;

impl TextDecoder {
    /// Decodes bytes as UTF-8, dropping a trailing character that was cut in half
    /// when the content was truncated, and replacing any other invalid sequence.
    pub fn decode(bytes: &[u8], was_truncated: bool) -> String {
        let usable = match std::str::from_utf8(bytes) {
            Err(error) if was_truncated && error.error_len().is_none() => {
                &bytes[..error.valid_up_to()]
            }
            _ => bytes,
        };
        String::from_utf8_lossy(usable).into_owned()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn decodes_valid_text_unchanged() {
        assert_eq!(
            TextDecoder::decode("hola ñandú".as_bytes(), false),
            "hola ñandú"
        );
    }

    #[test]
    fn drops_a_character_cut_in_half_when_truncated() {
        let bytes = "añ".as_bytes();

        assert_eq!(TextDecoder::decode(&bytes[..bytes.len() - 1], true), "a");
    }

    #[test]
    fn replaces_invalid_bytes_in_the_middle() {
        assert_eq!(
            TextDecoder::decode(&[b'a', 0xFF, b'b'], false),
            "a\u{FFFD}b"
        );
    }
}
