use serde::{Deserialize, Serialize};

use crate::domains::settings::domain::{
    PanelPosition, PreviewProvidersSettings, PreviewSettings, SizedProviderSettings,
    ToggleProviderSettings,
};

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PanelPositionDto {
    Right,
    Bottom,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SizedProviderDto {
    enabled: bool,
    max_size_megabytes: u32,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToggleProviderDto {
    enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PreviewProvidersDto {
    image: SizedProviderDto,
    text: SizedProviderDto,
    markdown: SizedProviderDto,
    json: SizedProviderDto,
    csv: SizedProviderDto,
    pdf: SizedProviderDto,
    audio: ToggleProviderDto,
    video: ToggleProviderDto,
    folder: ToggleProviderDto,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PreviewSettingsDto {
    panel_enabled: bool,
    show_panel: bool,
    panel_position: PanelPositionDto,
    panel_size_px: u32,
    quick_look_enabled: bool,
    providers: PreviewProvidersDto,
}

impl From<SizedProviderSettings> for SizedProviderDto {
    fn from(settings: SizedProviderSettings) -> Self {
        Self {
            enabled: settings.enabled,
            max_size_megabytes: settings.max_size_megabytes,
        }
    }
}

impl From<SizedProviderDto> for SizedProviderSettings {
    fn from(dto: SizedProviderDto) -> Self {
        Self {
            enabled: dto.enabled,
            max_size_megabytes: dto.max_size_megabytes,
        }
    }
}

impl From<PreviewSettings> for PreviewSettingsDto {
    fn from(settings: PreviewSettings) -> Self {
        let providers = settings.providers;
        Self {
            panel_enabled: settings.panel_enabled,
            show_panel: settings.show_panel,
            panel_position: match settings.panel_position {
                PanelPosition::Right => PanelPositionDto::Right,
                PanelPosition::Bottom => PanelPositionDto::Bottom,
            },
            panel_size_px: settings.panel_size_px,
            quick_look_enabled: settings.quick_look_enabled,
            providers: PreviewProvidersDto {
                image: providers.image.into(),
                text: providers.text.into(),
                markdown: providers.markdown.into(),
                json: providers.json.into(),
                csv: providers.csv.into(),
                pdf: providers.pdf.into(),
                audio: ToggleProviderDto {
                    enabled: providers.audio.enabled,
                },
                video: ToggleProviderDto {
                    enabled: providers.video.enabled,
                },
                folder: ToggleProviderDto {
                    enabled: providers.folder.enabled,
                },
            },
        }
    }
}

impl From<PreviewSettingsDto> for PreviewSettings {
    fn from(dto: PreviewSettingsDto) -> Self {
        let providers = dto.providers;
        Self {
            panel_enabled: dto.panel_enabled,
            show_panel: dto.show_panel,
            panel_position: match dto.panel_position {
                PanelPositionDto::Right => PanelPosition::Right,
                PanelPositionDto::Bottom => PanelPosition::Bottom,
            },
            panel_size_px: dto.panel_size_px,
            quick_look_enabled: dto.quick_look_enabled,
            providers: PreviewProvidersSettings {
                image: providers.image.into(),
                text: providers.text.into(),
                markdown: providers.markdown.into(),
                json: providers.json.into(),
                csv: providers.csv.into(),
                pdf: providers.pdf.into(),
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
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn round_trips_preview_settings_through_the_dto() {
        let defaults = PreviewSettings::default();
        let settings = PreviewSettings {
            panel_position: PanelPosition::Bottom,
            providers: PreviewProvidersSettings {
                pdf: SizedProviderSettings {
                    enabled: false,
                    ..defaults.providers.pdf
                },
                folder: ToggleProviderSettings { enabled: false },
                ..defaults.providers
            },
            ..defaults
        };

        let restored: PreviewSettings = PreviewSettingsDto::from(settings.clone()).into();

        assert_eq!(restored, settings);
    }

    #[test]
    fn serializes_with_camel_case_names() {
        let json =
            serde_json::to_value(PreviewSettingsDto::from(PreviewSettings::default())).unwrap();

        assert_eq!(json["panelPosition"], "right");
        assert_eq!(json["providers"]["text"]["maxSizeMegabytes"], 1);
        assert_eq!(json["quickLookEnabled"], true);
    }
}
