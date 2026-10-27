import { invoke } from "@tauri-apps/api/core";
import type { SettingsGateway } from "../../../application/ports/settings-gateway";
import type { AppSettings } from "../../../domain/entities/app-settings";

export const tauriSettingsGateway: SettingsGateway = {
  loadSettings: () => invoke<AppSettings>("load_settings"),
  saveSettings: (settings) => invoke<AppSettings>("save_settings", { settings }),
};
