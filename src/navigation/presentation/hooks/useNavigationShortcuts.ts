import { useEffect } from "react";
import { useDirectoryBrowsing } from "../../../directory-browsing";
import { useNavigation } from "../context/NavigationContext";

export function useNavigationShortcuts(isBlocked = false) {
  const goBack = useNavigation((state) => state.goBack);
  const goForward = useNavigation((state) => state.goForward);
  const navigateTo = useNavigation((state) => state.navigateTo);
  const parentPath = useDirectoryBrowsing((state) => state.listing?.parentPath ?? null);
  const refresh = useDirectoryBrowsing((state) => state.refresh);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isBlocked) return;
      if (event.altKey && event.key === "ArrowLeft") goBack();
      else if (event.altKey && event.key === "ArrowRight") goForward();
      else if (event.altKey && event.key === "ArrowUp" && parentPath !== null) navigateTo(parentPath);
      else if (event.key === "F5") refresh();
      else return;
      event.preventDefault();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goBack, goForward, navigateTo, parentPath, refresh, isBlocked]);
}
