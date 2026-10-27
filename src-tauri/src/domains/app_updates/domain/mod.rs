mod entities;
mod errors;

pub use entities::{AvailableUpdate, DownloadProgress, UpdateCheckResult};
pub use errors::AppUpdateError;

pub const RELEASE_PAGE_URL: &str = "https://github.com/GatoArtStudio/fithuner/releases/latest";
