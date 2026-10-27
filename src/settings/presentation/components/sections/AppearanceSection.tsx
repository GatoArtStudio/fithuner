import type { ThemePreference } from "../../../domain/entities/app-settings";
import { useSettings } from "../../context/SettingsContext";
import { SettingSelect } from "../SettingSelect";

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "Follow system" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function AppearanceSection() {
  const theme = useSettings((state) => state.settings.appearance.theme);
  const update = useSettings((state) => state.update);

  return (
    <SettingSelect
      label="Theme"
      description="Choose how Fithuner looks."
      value={theme}
      options={THEME_OPTIONS}
      onChange={(nextTheme) => void update({ appearance: { theme: nextTheme } })}
    />
  );
}
