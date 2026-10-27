use unicode_normalization::UnicodeNormalization;
use unicode_normalization::char::is_combining_mark;

pub fn fold_for_search(text: &str) -> String {
    text.nfd()
        .filter(|character| !is_combining_mark(*character))
        .flat_map(char::to_lowercase)
        .collect()
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct NameMatcher {
    terms: Vec<String>,
}

impl NameMatcher {
    /// Returns `None` when the text has no searchable words.
    pub fn new(text: &str) -> Option<Self> {
        let terms: Vec<String> = fold_for_search(text)
            .split_whitespace()
            .map(str::to_owned)
            .collect();
        (!terms.is_empty()).then_some(Self { terms })
    }

    pub fn matches(&self, name: &str) -> bool {
        let folded_name = fold_for_search(name);
        self.terms
            .iter()
            .all(|term| folded_name.contains(term.as_str()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn matcher(text: &str) -> NameMatcher {
        NameMatcher::new(text).unwrap()
    }

    #[test]
    fn ignores_letter_case() {
        assert!(matcher("REPORT").matches("quarterly report.pdf"));
    }

    #[test]
    fn ignores_accents_in_both_the_text_and_the_name() {
        assert!(matcher("cafe").matches("Café menu.txt"));
        assert!(matcher("canción").matches("cancion.mp3"));
    }

    #[test]
    fn requires_every_word_but_in_any_order() {
        assert!(matcher("rep 2024").matches("Report 2024.pdf"));
        assert!(matcher("2024 rep").matches("Report 2024.pdf"));
        assert!(!matcher("rep 2023").matches("Report 2024.pdf"));
    }

    #[test]
    fn matches_inside_words() {
        assert!(matcher("port").matches("Report.pdf"));
    }

    #[test]
    fn blank_text_has_nothing_to_search_for() {
        assert_eq!(NameMatcher::new(""), None);
        assert_eq!(NameMatcher::new("   \t "), None);
    }

    #[test]
    fn does_not_match_unrelated_names() {
        assert!(!matcher("invoice").matches("holiday.jpg"));
    }
}
