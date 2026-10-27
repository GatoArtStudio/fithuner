import { useEffect } from "react";
import { useUndo } from "../context/UndoContext";

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export function useUndoShortcuts(isBlocked: boolean) {
  const undo = useUndo((state) => state.undo);
  const redo = useUndo((state) => state.redo);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isBlocked || event.altKey || !(event.ctrlKey || event.metaKey) || isEditable(event.target)) return;
      const key = event.key.toLowerCase();

      if (key === "z" && !event.shiftKey) void undo();
      else if ((key === "z" && event.shiftKey) || (key === "y" && !event.shiftKey)) void redo();
      else return;
      event.preventDefault();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isBlocked, undo, redo]);
}
