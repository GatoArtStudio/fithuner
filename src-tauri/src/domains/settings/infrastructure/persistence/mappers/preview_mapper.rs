use crate::domains::settings::domain::{
    DEFAULT_PANEL_SIZE_PX, PanelPosition, PreviewProvidersSettings, PreviewSettings,
    SizedProviderSettings, ToggleProviderSettings,
};
use crate::domains::settings::infrastructure::persistence::models::{
    PanelPositionModel, PreviewModel, PreviewProvidersModel, SizedProviderModel,
    ToggleProviderModel,
};

const MIN_PANEL_SIZE_PX: u32 = 200;
const MAX_PANEL_SIZE_PX: u32 = 1200;
const MIN_PROVIDER_LIMIT_MB: u32 = 1;
const MAX_PROVIDER_LIMIT_MB: u32 = 4096;

pub fn preview_to_model(preview: &PreviewSettings) -> PreviewModel {
    let providers = &preview.providers;
    PreviewModel {
        panel_enabled: preview.panel_enabled,
        show_panel: preview.show_panel,
        panel_position: match preview.panel_position {
            PanelPosition::Right => PanelPositionModel::Right,
            PanelPosition::Bottom => PanelPositionModel::Bottom,
        },
        panel_size_px: Some(preview.panel_size_px),
        quick_look_enabled: preview.quick_look_enabled,
        providers: PreviewProvidersModel {
            image: sized_to_model(providers.image),
            text: sized_to_model(providers.text),
            markdown: sized_to_model(providers.markdown),
            json: sized_to_model(providers.json),
            csv: sized_to_model(providers.csv),
            pdf: sized_to_model(providers.pdf),
            audio: toggle_to_model(providers.audio),
            video: toggle_to_model(providers.video),
            folder: toggle_to_model(providers.folder),
        },
    }
}

pub fn preview_to_domain(model: PreviewModel) -> PreviewSettings {
    let defaults = PreviewProvidersSettings::default();
    let providers = model.providers;
    PreviewSettings {
        panel_enabled: model.panel_enabled,
        show_panel: model.show_panel,
        panel_position: match model.panel_position {
            PanelPositionModel::Right => PanelPosition::Right,
            PanelPositionModel::Bottom => PanelPosition::Bottom,
        },
        panel_size_px: model.panel_size_px.map_or(DEFAULT_PANEL_SIZE_PX, |size| {
            size.clamp(MIN_PANEL_SIZE_PX, MAX_PANEL_SIZE_PX)
        }),
        quick_look_enabled: model.quick_look_enabled,
        providers: PreviewProvidersSettings {
            image: sized_to_domain(&providers.image, defaults.image),
            text: sized_to_domain(&providers.text, defaults.text),
            markdown: sized_to_domain(&providers.markdown, defaults.markdown),
            json: sized_to_domain(&providers.json, defaults.json),
            csv: sized_to_domain(&providers.csv, defaults.csv),
            pdf: sized_to_domain(&providers.pdf, defaults.pdf),
            audio: ToggleProviderSettings {
                enabled: providers.audio.enabled,
            },
            video: ToggleProviderSettings {
                enabled: providers.video.enabled,
            },
            folder: ToggleProviderSettings {
                enabled: providers.folder.enabled,
            },
        },
    }
}

fn sized_to_model(settings: SizedProviderSettings) -> SizedProviderModel {
    SizedProviderModel {
        enabled: settings.enabled,
        max_size_megabytes: Some(settings.max_size_megabytes),
    }
}

fn toggle_to_model(settings: ToggleProviderSettings) -> ToggleProviderModel {
    ToggleProviderModel {
        enabled: settings.enabled,
    }
}

fn sized_to_domain(
    model: &SizedProviderModel,
    default: SizedProviderSettings,
) -> SizedProviderSettings {
    SizedProviderSettings {
        enabled: model.enabled,
        max_size_megabytes: model
            .max_size_megabytes
            .map_or(default.max_size_megabytes, |limit| {
                limit.clamp(MIN_PROVIDER_LIMIT_MB, MAX_PROVIDER_LIMIT_MB)
            }),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn an_empty_model_maps_to_the_default_preview_settings() {
        assert_eq!(
            preview_to_domain(PreviewModel::default()),
            PreviewSettings::default()
        );
    }

    #[test]
    fn round_trips_customized_preview_settings() {
        let defaults = PreviewSettings::default();
        let preview = PreviewSettings {
            show_panel: false,
            panel_position: PanelPosition::Bottom,
            panel_size_px: 500,
            providers: PreviewProvidersSettings {
                csv: SizedProviderSettings {
                    enabled: false,
                    max_size_megabytes: 12,
                },
                video: ToggleProviderSettings { enabled: false },
                ..defaults.providers
            },
            ..defaults
        };

        assert_eq!(preview_to_domain(preview_to_model(&preview)), preview);
    }

    #[test]
    fn clamps_out_of_range_sizes_and_limits() {
        let mut model = PreviewModel {
            panel_size_px: Some(5),
            ..PreviewModel::default()
        };
        model.providers.pdf.max_size_megabytes = Some(0);
        model.providers.image.max_size_megabytes = Some(999_999);

        let preview = preview_to_domain(model);

        assert_eq!(preview.panel_size_px, 200);
        assert_eq!(preview.providers.pdf.max_size_megabytes, 1);
        assert_eq!(preview.providers.image.max_size_megabytes, 4096);
    }

    #[test]
    fn a_provider_without_a_limit_uses_its_own_default_limit() {
        let mut model = PreviewModel::default();
        model.providers.json.enabled = false;

        let preview = preview_to_domain(model);

        assert!(!preview.providers.json.enabled);
        assert_eq!(preview.providers.json.max_size_megabytes, 2);
    }
}
