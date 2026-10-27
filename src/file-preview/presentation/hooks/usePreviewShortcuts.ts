import { useEffect } from "react";
import { usePreviewLayout } from "./usePreviewLayout";

export function usePreviewShortcuts(isBlocked: boolean) {
  const { isPreviewEnabled, togglePanel } = usePreviewLayout();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isBlocked || !isPreviewEnabled) return;
      if (event.altKey && !event.ctrlKey && !event.metaKey && event.key.toLowerCase() === "p") {
        event.preventDefault();
        togglePanel();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isBlocked, isPreviewEnabled, togglePanel]);
}
