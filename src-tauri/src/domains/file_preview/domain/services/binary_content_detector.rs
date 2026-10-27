const SAMPLE_BYTES: usize = 8192;
const MAX_REPLACEMENT_RATIO: f64 = 0.05;
const MAX_CONTROL_RATIO: f64 = 0.10;

pub struct BinaryContentDetector;

impl BinaryContentDetector {
    pub fn is_binary(bytes: &[u8]) -> bool {
        let sample = &bytes[..bytes.len().min(SAMPLE_BYTES)];
        if sample.contains(&0) {
            return true;
        }

        let complete_sample = match std::str::from_utf8(sample) {
            Err(error) if error.error_len().is_none() => &sample[..error.valid_up_to()],
            _ => sample,
        };
        let decoded = String::from_utf8_lossy(complete_sample);
        let character_count = decoded.chars().count();
        if character_count == 0 {
            return false;
        }
        let replacement_count = decoded
            .chars()
            .filter(|&character| character == '\u{FFFD}')
            .count();
        let control_count = decoded
            .chars()
            .filter(|character| {
                character.is_control()
                    && !matches!(character, '\n' | '\r' | '\t' | '\u{0C}' | '\u{1B}')
            })
            .count();

        let ratio = |count: usize| count as f64 / character_count as f64;
        ratio(replacement_count) > MAX_REPLACEMENT_RATIO || ratio(control_count) > MAX_CONTROL_RATIO
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn plain_text_and_empty_content_are_not_binary() {
        assert!(!BinaryContentDetector::is_binary(b""));
        assert!(!BinaryContentDetector::is_binary(
            b"fn main() {}\r\n\tprintln!(\"hi\");\n"
        ));
        assert!(!BinaryContentDetector::is_binary(
            "ñandú café 日本語".as_bytes()
        ));
    }

    #[test]
    fn nul_bytes_mean_binary() {
        assert!(BinaryContentDetector::is_binary(&[
            0x89, b'P', b'N', b'G', 0, 1, 2
        ]));
    }

    #[test]
    fn a_text_cut_in_the_middle_of_a_character_is_still_text() {
        let bytes = "café".as_bytes();

        assert!(!BinaryContentDetector::is_binary(&bytes[..bytes.len() - 1]));
    }

    #[test]
    fn invalid_utf8_noise_is_binary() {
        let noise: Vec<u8> = (0..200).map(|index| 0x80 + (index % 100) as u8).collect();

        assert!(BinaryContentDetector::is_binary(&noise));
    }

    #[test]
    fn control_character_noise_is_binary() {
        let noise: Vec<u8> = (1..32)
            .cycle()
            .take(300)
            .filter(|byte| !matches!(byte, 9 | 10 | 13))
            .collect();

        assert!(BinaryContentDetector::is_binary(&noise));
    }
}
