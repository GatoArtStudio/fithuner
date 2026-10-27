import type { ReactNode } from "react";
import { Icon } from "../../../shared/icons/Icon";
import { useSettings } from "../context/SettingsContext";

interface SettingsButtonProps {
  adornment?: ReactNode;
}

export function SettingsButton({ adornment }: SettingsButtonProps) {
  const openSettings = useSettings((state) => state.openSettings);

  return (
    <button
      type="button"
      className="icon-button"
      style={{ position: "relative" }}
      title="Settings (Ctrl+,)"
      aria-label="Settings"
      onClick={() => openSettings()}
    >
      <Icon name="settings" />
      {adornment}
    </button>
  );
}
