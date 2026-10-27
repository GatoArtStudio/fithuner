import { useEffect } from "react";
import { useCommandPalette } from "../context/CommandPaletteContext";

export function useCommandPaletteShortcuts(isBlocked: boolean) {
  const isOpen = useCommandPalette((state) => state.isOpen);
  const open = useCommandPalette((state) => state.open);
  const close = useCommandPalette((state) => state.close);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isBlocked || !(event.ctrlKey || event.metaKey) || event.altKey) return;
      const key = event.key.toLowerCase();
      const isPaletteShortcut = (key === "k" && !event.shiftKey) || (key === "p" && event.shiftKey);
      if (!isPaletteShortcut) return;

      event.preventDefault();
      if (isOpen) close();
      else open();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isBlocked, isOpen, open, close]);
}
