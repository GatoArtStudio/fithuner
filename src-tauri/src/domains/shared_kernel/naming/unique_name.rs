pub fn next_available_name(
    base_name: &str,
    existing_names: &[String],
    preserve_extension: bool,
) -> String {
    let is_taken = |candidate: &str| {
        existing_names
            .iter()
            .any(|name| name.eq_ignore_ascii_case(candidate))
    };

    if !is_taken(base_name) {
        return base_name.to_owned();
    }

    let (stem, extension) = match base_name.rfind('.') {
        Some(dot_index) if preserve_extension && dot_index > 0 => base_name.split_at(dot_index),
        _ => (base_name, ""),
    };
    (2..)
        .map(|number| format!("{stem} ({number}){extension}"))
        .find(|candidate| !is_taken(candidate))
        .expect("an unused numbered name always exists")
}

#[cfg(test)]
mod tests {
    use super::*;

    fn names(values: &[&str]) -> Vec<String> {
        values.iter().map(|value| value.to_string()).collect()
    }

    #[test]
    fn keeps_the_base_name_when_it_is_free() {
        assert_eq!(next_available_name("report.txt", &[], true), "report.txt");
    }

    #[test]
    fn numbers_the_name_after_collisions() {
        let existing = names(&["notes", "notes (2)"]);

        assert_eq!(next_available_name("notes", &existing, false), "notes (3)");
    }

    #[test]
    fn keeps_the_extension_after_the_number() {
        let existing = names(&["report.txt"]);

        assert_eq!(
            next_available_name("report.txt", &existing, true),
            "report (2).txt"
        );
    }

    #[test]
    fn does_not_split_extensions_when_not_preserving_them() {
        let existing = names(&["v1.2"]);

        assert_eq!(next_available_name("v1.2", &existing, false), "v1.2 (2)");
    }

    #[test]
    fn treats_leading_dots_as_part_of_the_stem() {
        let existing = names(&[".env"]);

        assert_eq!(next_available_name(".env", &existing, true), ".env (2)");
    }

    #[test]
    fn ignores_case_when_checking_collisions() {
        let existing = names(&["REPORT.TXT"]);

        assert_eq!(
            next_available_name("report.txt", &existing, true),
            "report (2).txt"
        );
    }
}
