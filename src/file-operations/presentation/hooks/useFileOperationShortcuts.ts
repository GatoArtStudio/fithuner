import { useEffect } from "react";
import { useFileOperations } from "../context/FileOperationsContext";

function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
}

export function useFileOperationShortcuts() {
  const createEntry = useFileOperations((state) => state.createEntry);
  const startRename = useFileOperations((state) => state.startRename);
  const trashSelected = useFileOperations((state) => state.trashSelected);
  const requestPermanentDelete = useFileOperations((state) => state.requestPermanentDelete);
  const isDialogOpen = useFileOperations((state) => state.pendingPermanentDeletePaths !== null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target) || isDialogOpen) return;

      const key = event.key.toLowerCase();
      if (event.key === "F2") startRename();
      else if (event.key === "Delete" && event.shiftKey) requestPermanentDelete();
      else if (event.key === "Delete") void trashSelected();
      else if (key === "n" && event.ctrlKey && event.shiftKey) void createEntry("directory");
      else if (key === "n" && event.ctrlKey && event.altKey) void createEntry("file");
      else return;
      event.preventDefault();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [createEntry, startRename, trashSelected, requestPermanentDelete, isDialogOpen]);
}
