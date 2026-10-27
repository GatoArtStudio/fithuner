export type ThemePreference = "system" | "light" | "dark";

export interface AppearanceSettings {
  theme: ThemePreference;
}

export interface BrowsingSettings {
  showHiddenFiles: boolean;
  confirmBeforeTrash: boolean;
}

export type PanelPosition = "right" | "bottom";

export interface SizedProviderSettings {
  enabled: boolean;
  maxSizeMegabytes: number;
}

export interface ToggleProviderSettings {
  enabled: boolean;
}

export interface PreviewProvidersSettings {
  image: SizedProviderSettings;
  text: SizedProviderSettings;
  markdown: SizedProviderSettings;
  json: SizedProviderSettings;
  csv: SizedProviderSettings;
  pdf: SizedProviderSettings;
  audio: ToggleProviderSettings;
  video: ToggleProviderSettings;
  folder: ToggleProviderSettings;
}

export interface PreviewSettings {
  panelEnabled: boolean;
  showPanel: boolean;
  panelPosition: PanelPosition;
  panelSizePx: number;
  quickLookEnabled: boolean;
  providers: PreviewProvidersSettings;
}

export interface AppSettings {
  appearance: AppearanceSettings;
  browsing: BrowsingSettings;
  preview: PreviewSettings;
}

export type PreviewProvidersPatch = {
  [Provider in keyof PreviewProvidersSettings]?: Partial<PreviewProvidersSettings[Provider]>;
};

export interface PreviewPatch extends Partial<Omit<PreviewSettings, "providers">> {
  providers?: PreviewProvidersPatch;
}

export interface SettingsPatch {
  appearance?: Partial<AppearanceSettings>;
  browsing?: Partial<BrowsingSettings>;
  preview?: PreviewPatch;
}

export type SettingsSection = "general" | "appearance" | "preview";

export const DEFAULT_SETTINGS: AppSettings = {
  appearance: { theme: "system" },
  browsing: { showHiddenFiles: false, confirmBeforeTrash: false },
  preview: {
    panelEnabled: true,
    showPanel: true,
    panelPosition: "right",
    panelSizePx: 340,
    quickLookEnabled: true,
    providers: {
      image: { enabled: true, maxSizeMegabytes: 25 },
      text: { enabled: true, maxSizeMegabytes: 1 },
      markdown: { enabled: true, maxSizeMegabytes: 1 },
      json: { enabled: true, maxSizeMegabytes: 2 },
      csv: { enabled: true, maxSizeMegabytes: 5 },
      pdf: { enabled: true, maxSizeMegabytes: 100 },
      audio: { enabled: true },
      video: { enabled: true },
      folder: { enabled: true },
    },
  },
};
