import { Icon } from "../../../shared/icons/Icon";
import { useWorkspace } from "../context/WorkspaceContext";

export function SplitToggleButton() {
  const isSplit = useWorkspace((state) => state.workspace.panes.length > 1);
  const toggleSplit = useWorkspace((state) => state.toggleSplit);

  return (
    <button
      type="button"
      className="icon-button"
      aria-pressed={isSplit}
      title={isSplit ? "Close split view (Ctrl+\\)" : "Split view (Ctrl+\\)"}
      aria-label="Split view"
      onClick={toggleSplit}
    >
      <Icon name="split" />
    </button>
  );
}
