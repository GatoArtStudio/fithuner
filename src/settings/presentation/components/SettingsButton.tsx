import { Icon } from "../../../shared/icons/Icon";
import { useSettings } from "../context/SettingsContext";

export function SettingsButton() {
  const openSettings = useSettings((state) => state.openSettings);

  return (
    <button
      type="button"
      className="icon-button"
      title="Settings (Ctrl+,)"
      aria-label="Settings"
      onClick={() => openSettings()}
    >
      <Icon name="settings" />
    </button>
  );
}
