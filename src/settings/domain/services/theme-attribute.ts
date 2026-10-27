import type { ThemePreference } from "../entities/app-settings";

export function themeAttribute(preference: ThemePreference): "light" | "dark" | null {
  return preference === "system" ? null : preference;
}
