import { useEffect } from "react";
import { useSettings } from "../context/SettingsContext";

export function useSettingsShortcut() {
  const openSettings = useSettings((state) => state.openSettings);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key === ",") {
        event.preventDefault();
        openSettings();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openSettings]);
}
