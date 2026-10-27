export type ThemePreference = "system" | "light" | "dark";

export interface AppearanceSettings {
  theme: ThemePreference;
}

export interface BrowsingSettings {
  showHiddenFiles: boolean;
  confirmBeforeTrash: boolean;
}

export interface AppSettings {
  appearance: AppearanceSettings;
  browsing: BrowsingSettings;
}

export interface SettingsPatch {
  appearance?: Partial<AppearanceSettings>;
  browsing?: Partial<BrowsingSettings>;
}

export type SettingsSection = "general" | "appearance";

export const DEFAULT_SETTINGS: AppSettings = {
  appearance: { theme: "system" },
  browsing: { showHiddenFiles: false, confirmBeforeTrash: false },
};
