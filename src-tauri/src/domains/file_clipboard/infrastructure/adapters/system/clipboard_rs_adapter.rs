use std::path::PathBuf;
#[cfg(target_os = "linux")]
use std::sync::Mutex as ContextMutex;
use std::sync::Mutex;

use clipboard_rs::{Clipboard, ClipboardContext};

use super::file_uri::file_uri_to_path;
use crate::domains::file_clipboard::application::SystemClipboardPort;
use crate::domains::file_clipboard::domain::ClipboardError;

type ClipboardResult<T> = Result<T, String>;

pub struct ClipboardRsAdapter {
    #[cfg(target_os = "linux")]
    shared_context: ContextMutex<Option<ClipboardContext>>,
    last_written: Mutex<Vec<PathBuf>>,
}

impl ClipboardRsAdapter {
    pub fn new() -> Self {
        Self {
            #[cfg(target_os = "linux")]
            shared_context: ContextMutex::new(None),
            last_written: Mutex::new(Vec::new()),
        }
    }

    /// On X11 and Wayland the clipboard content disappears when its owner is dropped,
    /// so Linux keeps one context alive for the whole application.
    #[cfg(target_os = "linux")]
    fn with_context<T>(
        &self,
        action: impl FnOnce(&ClipboardContext) -> clipboard_rs::Result<T>,
    ) -> ClipboardResult<T> {
        let mut shared_context = self.shared_context.lock().unwrap();
        if shared_context.is_none() {
            *shared_context = Some(ClipboardContext::new().map_err(|error| error.to_string())?);
        }
        let context = shared_context
            .as_ref()
            .expect("the context was just created");
        action(context).map_err(|error| error.to_string())
    }

    #[cfg(not(target_os = "linux"))]
    fn with_context<T>(
        &self,
        action: impl FnOnce(&ClipboardContext) -> clipboard_rs::Result<T>,
    ) -> ClipboardResult<T> {
        let context = ClipboardContext::new().map_err(|error| error.to_string())?;
        action(&context).map_err(|error| error.to_string())
    }
}

#[cfg(target_os = "linux")]
fn to_clipboard_entry(path: &std::path::Path) -> String {
    super::file_uri::path_to_file_uri(path)
}

#[cfg(not(target_os = "linux"))]
fn to_clipboard_entry(path: &std::path::Path) -> String {
    path.to_string_lossy().into_owned()
}

impl SystemClipboardPort for ClipboardRsAdapter {
    fn write_files(&self, paths: &[PathBuf]) -> Result<(), ClipboardError> {
        *self.last_written.lock().unwrap() = paths.to_vec();
        let entries = paths.iter().map(|path| to_clipboard_entry(path)).collect();

        if let Err(reason) = self.with_context(|context| context.set_files(entries)) {
            eprintln!("System clipboard unavailable, keeping files in memory only: {reason}");
        }
        Ok(())
    }

    fn read_files(&self) -> Result<Vec<PathBuf>, ClipboardError> {
        match self.with_context(|context| context.get_files()) {
            Ok(entries) => Ok(entries
                .iter()
                .map(|entry| file_uri_to_path(entry))
                .collect()),
            Err(reason) => {
                let remembered = self.last_written.lock().unwrap().clone();
                if remembered.is_empty() {
                    Err(ClipboardError::Unavailable(reason))
                } else {
                    Ok(remembered)
                }
            }
        }
    }
}
