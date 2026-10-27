import type { AppSettings, SettingsPatch } from "../entities/app-settings";

export function mergeSettings(settings: AppSettings, patch: SettingsPatch): AppSettings {
  return {
    appearance: { ...settings.appearance, ...patch.appearance },
    browsing: { ...settings.browsing, ...patch.browsing },
  };
}
