import type { Pane } from "../entities/pane";
import type { Tab } from "../entities/tab";
import type { Workspace } from "../entities/workspace";

export interface TabLocation {
  pane: Pane;
  tab: Tab;
  index: number;
}

export function findTab(workspace: Workspace, tabId: string): TabLocation | null {
  for (const pane of workspace.panes) {
    const index = pane.tabs.findIndex((tab) => tab.id === tabId);
    if (index >= 0) return { pane, tab: pane.tabs[index], index };
  }
  return null;
}

export function findPane(workspace: Workspace, paneId: string): Pane | null {
  return workspace.panes.find((pane) => pane.id === paneId) ?? null;
}

export function activePaneOf(workspace: Workspace): Pane {
  return findPane(workspace, workspace.activePaneId) ?? workspace.panes[0];
}

export function activeTabOf(pane: Pane): Tab {
  return pane.tabs.find((tab) => tab.id === pane.activeTabId) ?? pane.tabs[0];
}

export function otherPaneOf(workspace: Workspace, paneId: string): Pane | null {
  return workspace.panes.find((pane) => pane.id !== paneId) ?? null;
}

export function allTabs(workspace: Workspace): Tab[] {
  return workspace.panes.flatMap((pane) => pane.tabs);
}

export function isSplit(workspace: Workspace): boolean {
  return workspace.panes.length > 1;
}
