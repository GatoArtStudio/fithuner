import { useEffect } from "react";
import { useWorkspace } from "../context/WorkspaceContext";

export function useWorkspaceShortcuts(isBlocked = false) {
  const newTab = useWorkspace((state) => state.newTab);
  const closeTab = useWorkspace((state) => state.closeTab);
  const cycleTab = useWorkspace((state) => state.cycleTab);
  const activateTabAtPosition = useWorkspace((state) => state.activateTabAtPosition);
  const activeTabId = useWorkspace((state) => {
    const pane = state.workspace.panes.find((candidate) => candidate.id === state.workspace.activePaneId);
    return pane?.activeTabId;
  });

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isBlocked || event.altKey || !(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();

      if (!event.shiftKey && key === "t") newTab();
      else if (!event.shiftKey && key === "w" && activeTabId) closeTab(activeTabId);
      else if (key === "tab") cycleTab(event.shiftKey ? -1 : 1);
      else if (!event.shiftKey && key === "pagedown") cycleTab(1);
      else if (!event.shiftKey && key === "pageup") cycleTab(-1);
      else if (!event.shiftKey && /^[1-9]$/.test(key)) activateTabAtPosition(Number(key));
      else return;
      event.preventDefault();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isBlocked, newTab, closeTab, cycleTab, activateTabAtPosition, activeTabId]);
}
