import { useDirectoryBrowsing } from "../../directory-browsing";
import { Icon } from "../../shared/icons/Icon";
import { selectCanGoBack, selectCanGoForward } from "../application/navigation-store";
import { useNavigation } from "./NavigationContext";

export function NavigationControls() {
  const canGoBack = useNavigation(selectCanGoBack);
  const canGoForward = useNavigation(selectCanGoForward);
  const goBack = useNavigation((state) => state.goBack);
  const goForward = useNavigation((state) => state.goForward);
  const navigateTo = useNavigation((state) => state.navigateTo);
  const parentPath = useDirectoryBrowsing((state) => state.listing?.parentPath ?? null);
  const refresh = useDirectoryBrowsing((state) => state.refresh);

  return (
    <div role="group" aria-label="Navigation" style={{ display: "flex", gap: 2 }}>
      <button type="button" className="icon-button" title="Back (Alt+Left)" disabled={!canGoBack} onClick={goBack}>
        <Icon name="back" />
      </button>
      <button type="button" className="icon-button" title="Forward (Alt+Right)" disabled={!canGoForward} onClick={goForward}>
        <Icon name="forward" />
      </button>
      <button
        type="button"
        className="icon-button"
        title="Up (Alt+Up)"
        disabled={parentPath === null}
        onClick={() => parentPath !== null && navigateTo(parentPath)}
      >
        <Icon name="up" />
      </button>
      <button type="button" className="icon-button" title="Refresh (F5)" onClick={refresh}>
        <Icon name="refresh" />
      </button>
    </div>
  );
}
