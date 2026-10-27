mod errors;
mod services;

pub use errors::FolderWatchingError;
pub use services::ChangeCoalescer;

pub const MAX_WATCHED_FOLDERS: usize = 32;
