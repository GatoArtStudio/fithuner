import type { PaletteItem } from "../command-palette";
import { activePaneOf, activeTabOf, isSplit, otherPaneOf } from "../workspace";
import { command } from "./palette-command";
import type { PaletteStores } from "./palette-sources";

export function buildWorkspaceCommands(stores: PaletteStores): (PaletteItem | null)[] {
  const workspaceState = stores.workspaceStore.getState();
  const { workspace } = workspaceState;
  const activePane = activePaneOf(workspace);
  const activeTabId = activeTabOf(activePane).id;
  const isSplitView = isSplit(workspace);
  const canCloseTab = activePane.tabs.length > 1 || isSplitView;

  const session = stores.activeSession();
  const isSearchOpen = session.searchStore.getState().isOpen;
  const selectedPaths = session.directoryBrowsingStore.getState().selectedPaths;
  const otherPane = otherPaneOf(workspace, activePane.id);
  const otherSession = otherPane && workspaceState.sessions[activeTabOf(otherPane).sessionId];
  const otherFolder = otherSession?.directoryBrowsingStore.getState().listing?.path ?? null;
  const canTransferToOtherPane = otherFolder !== null && selectedPaths.length > 0 && !isSearchOpen;

  const transferToOtherPane = (mode: "copy" | "move") => () => {
    if (otherFolder === null) return;
    void stores.fileTransferStore
      .getState()
      .startTransfer({ sources: selectedPaths, destinationDirectory: otherFolder, mode });
  };

  return [
    command("new-tab", "New tab", () => workspaceState.newTab(), { shortcut: "Ctrl+T", keywords: ["open"] }),
    command("duplicate-tab", "Duplicate tab", () => workspaceState.duplicateTab(activeTabId), {
      keywords: ["clone", "copy"],
    }),
    command("close-tab", "Close tab", () => workspaceState.closeTab(activeTabId), {
      shortcut: "Ctrl+W",
      isAvailable: canCloseTab,
    }),
    command("close-other-tabs", "Close other tabs", () => workspaceState.closeOtherTabs(activeTabId), {
      isAvailable: activePane.tabs.length > 1,
    }),
    command("next-tab", "Next tab", () => workspaceState.cycleTab(1), {
      shortcut: "Ctrl+Tab",
      isAvailable: activePane.tabs.length > 1,
    }),
    command("previous-tab", "Previous tab", () => workspaceState.cycleTab(-1), {
      shortcut: "Ctrl+Shift+Tab",
      isAvailable: activePane.tabs.length > 1,
    }),
    command("split", isSplitView ? "Close split view" : "Split view", () => workspaceState.toggleSplit(), {
      shortcut: "Ctrl+\\",
      keywords: ["panes", "side by side", "dual"],
    }),
    command("switch-pane", "Switch to the other pane", () => workspaceState.switchPane(), {
      shortcut: "F6",
      isAvailable: isSplitView,
    }),
    command("move-tab-to-other-pane", "Move tab to the other pane", () => workspaceState.moveTabToOtherPane(activeTabId), {
      isAvailable: isSplitView,
    }),
    command("copy-to-other-pane", "Copy to the other pane", transferToOtherPane("copy"), {
      keywords: ["split", "duplicate"],
      isAvailable: canTransferToOtherPane,
    }),
    command("move-to-other-pane", "Move to the other pane", transferToOtherPane("move"), {
      keywords: ["split"],
      isAvailable: canTransferToOtherPane,
    }),
  ];
}
