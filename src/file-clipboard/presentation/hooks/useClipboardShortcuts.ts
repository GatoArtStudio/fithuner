import { useEffect } from "react";
import { useFileClipboard } from "../context/FileClipboardContext";

function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
}

export function useClipboardShortcuts(isBlocked: boolean) {
  const copySelected = useFileClipboard((state) => state.copySelected);
  const cutSelected = useFileClipboard((state) => state.cutSelected);
  const paste = useFileClipboard((state) => state.paste);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isBlocked || isTypingTarget(event.target)) return;
      if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) return;

      const key = event.key.toLowerCase();
      if (key === "c") void copySelected();
      else if (key === "x") void cutSelected();
      else if (key === "v") void paste();
      else return;
      event.preventDefault();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isBlocked, copySelected, cutSelected, paste]);
}
