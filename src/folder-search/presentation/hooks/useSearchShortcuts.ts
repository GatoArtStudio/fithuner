import { useEffect } from "react";
import { useSearch } from "../context/SearchContext";

export function useSearchShortcuts(isBlocked: boolean) {
  const open = useSearch((state) => state.open);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isBlocked) return;
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === "f") {
        event.preventDefault();
        open();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isBlocked, open]);
}
