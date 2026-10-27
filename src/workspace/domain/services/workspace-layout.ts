import type { PaneLayout, WorkspaceLayout } from "../entities/workspace-layout";
import { MAX_SPLIT_RATIO, MIN_SPLIT_RATIO, type Workspace } from "../entities/workspace";

export const MAX_RESTORED_TABS_PER_PANE = 50;

function clampIndex(value: unknown, length: number): number {
  const index = typeof value === "number" && Number.isInteger(value) ? value : 0;
  return Math.min(Math.max(index, 0), length - 1);
}

export function clampSplitRatio(value: unknown): number {
  const ratio = typeof value === "number" && Number.isFinite(value) ? value : 0.5;
  return Math.min(Math.max(ratio, MIN_SPLIT_RATIO), MAX_SPLIT_RATIO);
}

/** Describes where every tab is; tabs whose folder is not known yet are left out. */
export function layoutOf(
  workspace: Workspace,
  pathOfSession: (sessionId: string) => string | undefined,
): WorkspaceLayout | null {
  const panes: (PaneLayout & { paneId: string })[] = [];

  for (const pane of workspace.panes) {
    const known = pane.tabs.flatMap((tab) => {
      const path = pathOfSession(tab.sessionId);
      return path === undefined ? [] : [{ tabId: tab.id, path }];
    });
    if (known.length === 0) continue;
    const activeIndex = known.findIndex((entry) => entry.tabId === pane.activeTabId);
    panes.push({
      paneId: pane.id,
      paths: known.map((entry) => entry.path),
      activeIndex: Math.max(activeIndex, 0),
    });
  }

  if (panes.length === 0) return null;
  const activePaneIndex = Math.max(
    panes.findIndex((pane) => pane.paneId === workspace.activePaneId),
    0,
  );
  return {
    panes: panes.map(({ paths, activeIndex }) => ({ paths, activeIndex })),
    activePaneIndex,
    splitRatio: workspace.splitRatio,
  };
}

function parsePane(value: unknown): PaneLayout | null {
  if (typeof value !== "object" || value === null) return null;
  const { paths, activeIndex } = value as Record<string, unknown>;
  if (!Array.isArray(paths)) return null;
  const validPaths = paths
    .filter((path): path is string => typeof path === "string" && path !== "")
    .slice(0, MAX_RESTORED_TABS_PER_PANE);
  if (validPaths.length === 0) return null;
  return { paths: validPaths, activeIndex: clampIndex(activeIndex, validPaths.length) };
}

/** Reads a saved layout defensively: anything unexpected is repaired or rejected, never trusted. */
export function parseWorkspaceLayout(value: unknown): WorkspaceLayout | null {
  if (typeof value !== "object" || value === null) return null;
  const { panes, activePaneIndex, splitRatio } = value as Record<string, unknown>;
  if (!Array.isArray(panes)) return null;

  const parsedPanes = panes.slice(0, 2).map(parsePane);
  if (parsedPanes.length === 0 || parsedPanes.some((pane) => pane === null)) return null;
  return {
    panes: parsedPanes as PaneLayout[],
    activePaneIndex: clampIndex(activePaneIndex, parsedPanes.length),
    splitRatio: clampSplitRatio(splitRatio),
  };
}
