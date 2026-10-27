use crate::domains::settings::domain::AppSettings;

pub trait LoadSettingsUseCase: Send + Sync {
    fn execute(&self) -> AppSettings;
}
