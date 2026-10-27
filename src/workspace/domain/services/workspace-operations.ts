import type { Pane } from "../entities/pane";
import type { Tab } from "../entities/tab";
import { MAX_SPLIT_RATIO, MIN_SPLIT_RATIO, type Workspace } from "../entities/workspace";
import { activePaneOf, findPane, findTab } from "./workspace-queries";

export function createWorkspace(paneId: string, tab: Tab): Workspace {
  return { panes: [{ id: paneId, tabs: [tab], activeTabId: tab.id }], activePaneId: paneId, splitRatio: 0.5 };
}

function replacePane(workspace: Workspace, pane: Pane): Workspace {
  return { ...workspace, panes: workspace.panes.map((candidate) => (candidate.id === pane.id ? pane : candidate)) };
}

function insertAfterActive(pane: Pane, tab: Tab): Pane {
  const activeIndex = pane.tabs.findIndex((candidate) => candidate.id === pane.activeTabId);
  const tabs = [...pane.tabs];
  tabs.splice(activeIndex + 1, 0, tab);
  return { ...pane, tabs, activeTabId: tab.id };
}

export function addTab(workspace: Workspace, paneId: string, tab: Tab): Workspace {
  const pane = findPane(workspace, paneId);
  if (!pane) return workspace;
  return { ...replacePane(workspace, insertAfterActive(pane, tab)), activePaneId: paneId };
}

export function activateTab(workspace: Workspace, tabId: string): Workspace {
  const location = findTab(workspace, tabId);
  if (!location) return workspace;
  return { ...replacePane(workspace, { ...location.pane, activeTabId: tabId }), activePaneId: location.pane.id };
}

export function activatePane(workspace: Workspace, paneId: string): Workspace {
  if (!findPane(workspace, paneId) || workspace.activePaneId === paneId) return workspace;
  return { ...workspace, activePaneId: paneId };
}

function withoutTab(pane: Pane, index: number): Pane {
  const tabs = pane.tabs.filter((_, position) => position !== index);
  const removedWasActive = pane.tabs[index].id === pane.activeTabId;
  const activeTabId = removedWasActive ? tabs[Math.min(index, tabs.length - 1)].id : pane.activeTabId;
  return { ...pane, tabs, activeTabId };
}

function withoutPane(workspace: Workspace, paneId: string): Workspace {
  const panes = workspace.panes.filter((pane) => pane.id !== paneId);
  const activePaneId = workspace.activePaneId === paneId ? panes[0].id : workspace.activePaneId;
  return { ...workspace, panes, activePaneId };
}

export function closeTab(workspace: Workspace, tabId: string): Workspace {
  const location = findTab(workspace, tabId);
  if (!location) return workspace;
  const { pane, index } = location;

  if (pane.tabs.length > 1) return replacePane(workspace, withoutTab(pane, index));
  if (workspace.panes.length > 1) return withoutPane(workspace, pane.id);
  return workspace;
}

export function closeOtherTabs(workspace: Workspace, tabId: string): Workspace {
  const location = findTab(workspace, tabId);
  if (!location) return workspace;
  const pane = { ...location.pane, tabs: [location.tab], activeTabId: tabId };
  return { ...replacePane(workspace, pane), activePaneId: pane.id };
}

export function cycleTab(workspace: Workspace, step: 1 | -1): Workspace {
  const pane = activePaneOf(workspace);
  if (pane.tabs.length < 2) return workspace;
  const index = pane.tabs.findIndex((tab) => tab.id === pane.activeTabId);
  const next = (index + step + pane.tabs.length) % pane.tabs.length;
  return replacePane(workspace, { ...pane, activeTabId: pane.tabs[next].id });
}

export function activateTabAtPosition(workspace: Workspace, position: number): Workspace {
  const pane = activePaneOf(workspace);
  const tab = position === 9 ? pane.tabs[pane.tabs.length - 1] : pane.tabs[position - 1];
  return tab ? replacePane(workspace, { ...pane, activeTabId: tab.id }) : workspace;
}

export function reorderTab(workspace: Workspace, tabId: string, toIndex: number): Workspace {
  const location = findTab(workspace, tabId);
  if (!location) return workspace;
  const tabs = location.pane.tabs.filter((tab) => tab.id !== tabId);
  const target = Math.max(0, Math.min(toIndex, tabs.length));
  tabs.splice(target, 0, location.tab);
  if (tabs.every((tab, position) => tab.id === location.pane.tabs[position].id)) return workspace;
  return replacePane(workspace, { ...location.pane, tabs });
}

export function moveTabToPane(workspace: Workspace, tabId: string, targetPaneId: string): Workspace {
  const location = findTab(workspace, tabId);
  const target = findPane(workspace, targetPaneId);
  if (!location || !target || location.pane.id === targetPaneId) return workspace;

  const withTargetTab = replacePane(workspace, insertAfterActive(target, location.tab));
  const source = findPane(withTargetTab, location.pane.id) as Pane;
  const moved =
    source.tabs.length > 1
      ? replacePane(withTargetTab, withoutTab(source, location.index))
      : withoutPane(withTargetTab, source.id);
  return { ...moved, activePaneId: targetPaneId };
}

export function splitWorkspace(workspace: Workspace, newPaneId: string, tab: Tab): Workspace {
  if (workspace.panes.length > 1) return workspace;
  const pane: Pane = { id: newPaneId, tabs: [tab], activeTabId: tab.id };
  return { ...workspace, panes: [...workspace.panes, pane], activePaneId: newPaneId };
}

export function unsplitWorkspace(workspace: Workspace): Workspace {
  if (workspace.panes.length < 2) return workspace;
  const active = activePaneOf(workspace);
  const [first, second] = workspace.panes;
  const merged: Pane = {
    id: first.id,
    tabs: [...first.tabs, ...second.tabs],
    activeTabId: active.activeTabId,
  };
  return { ...workspace, panes: [merged], activePaneId: merged.id };
}

export function setSplitRatio(workspace: Workspace, ratio: number): Workspace {
  const splitRatio = Math.max(MIN_SPLIT_RATIO, Math.min(MAX_SPLIT_RATIO, ratio));
  return splitRatio === workspace.splitRatio ? workspace : { ...workspace, splitRatio };
}
