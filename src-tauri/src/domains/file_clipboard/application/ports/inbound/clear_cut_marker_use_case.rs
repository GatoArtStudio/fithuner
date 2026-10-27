pub trait ClearCutMarkerUseCase: Send + Sync {
    fn execute(&self);
}
