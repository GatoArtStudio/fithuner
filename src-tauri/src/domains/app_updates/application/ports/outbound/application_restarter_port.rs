pub trait ApplicationRestarterPort: Send + Sync {
    fn restart(&self);
}
