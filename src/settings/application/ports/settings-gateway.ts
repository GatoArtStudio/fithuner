import type { AppSettings } from "../../domain/entities/app-settings";

export interface SettingsGateway {
  loadSettings(): Promise<AppSettings>;
  saveSettings(settings: AppSettings): Promise<AppSettings>;
}
