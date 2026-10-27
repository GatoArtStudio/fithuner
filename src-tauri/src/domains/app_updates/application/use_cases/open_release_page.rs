use std::sync::Arc;

use crate::domains::app_updates::application::ports::{
    ExternalLinkOpenerPort, OpenReleasePageUseCase,
};
use crate::domains::app_updates::domain::{AppUpdateError, RELEASE_PAGE_URL};

pub struct OpenReleasePage {
    link_opener: Arc<dyn ExternalLinkOpenerPort>,
}

impl OpenReleasePage {
    pub fn new(link_opener: Arc<dyn ExternalLinkOpenerPort>) -> Self {
        Self { link_opener }
    }
}

impl OpenReleasePageUseCase for OpenReleasePage {
    fn execute(&self) -> Result<(), AppUpdateError> {
        self.link_opener.open(RELEASE_PAGE_URL)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domains::app_updates::application::use_cases::fake_ports::FakeLinkOpener;

    #[test]
    fn opens_the_release_page_of_the_project() {
        let opener = Arc::new(FakeLinkOpener::default());

        OpenReleasePage::new(opener.clone()).execute().unwrap();

        assert_eq!(
            *opener.opened.lock().unwrap(),
            vec![RELEASE_PAGE_URL.to_string()]
        );
        assert!(RELEASE_PAGE_URL.starts_with("https://"));
    }
}
