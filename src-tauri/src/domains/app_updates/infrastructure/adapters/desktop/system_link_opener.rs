use crate::domains::app_updates::application::ExternalLinkOpenerPort;
use crate::domains::app_updates::domain::AppUpdateError;

pub struct SystemLinkOpener;

fn ensure_https(url: &str) -> Result<(), AppUpdateError> {
    if url.starts_with("https://") {
        Ok(())
    } else {
        Err(AppUpdateError::Unexpected(
            "only https links can be opened".into(),
        ))
    }
}

impl ExternalLinkOpenerPort for SystemLinkOpener {
    fn open(&self, url: &str) -> Result<(), AppUpdateError> {
        ensure_https(url)?;
        opener::open(url).map_err(|error| AppUpdateError::Unexpected(error.to_string()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_https_links() {
        assert!(ensure_https("https://github.com/GatoArtStudio/fithuner/releases").is_ok());
    }

    #[test]
    fn rejects_other_schemes() {
        for url in [
            "http://example.com",
            "file:///etc/passwd",
            "javascript:alert(1)",
            "ftp://x",
        ] {
            assert!(ensure_https(url).is_err(), "{url} should be rejected");
        }
    }
}
