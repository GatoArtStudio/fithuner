import { createStore, type StoreApi } from "zustand/vanilla";
import type { Workspace } from "../../domain/entities/workspace";
import {
  activatePane,
  activateTab,
  activateTabAtPosition,
  addTab,
  closeOtherTabs,
  closeTab,
  createWorkspace,
  cycleTab,
  moveTabToPane,
  reorderTab,
  setSplitRatio,
  splitWorkspace,
  unsplitWorkspace,
} from "../../domain/services/workspace-operations";
import {
  activePaneOf,
  activeTabOf,
  allTabs,
  findTab,
  isSplit,
  otherPaneOf,
} from "../../domain/services/workspace-queries";

export interface WorkspaceSession {
  id: string;
}

export interface WorkspaceState<Session extends WorkspaceSession> {
  workspace: Workspace;
  sessions: Record<string, Session>;
  newTab: (paneId?: string) => void;
  duplicateTab: (tabId: string) => void;
  closeTab: (tabId: string) => void;
  closeOtherTabs: (tabId: string) => void;
  activateTab: (tabId: string) => void;
  activatePane: (paneId: string) => void;
  cycleTab: (step: 1 | -1) => void;
  activateTabAtPosition: (position: number) => void;
  reorderTab: (tabId: string, toIndex: number) => void;
  moveTabToOtherPane: (tabId: string) => void;
  toggleSplit: () => void;
  switchPane: () => void;
  setSplitRatio: (ratio: number) => void;
}

export type WorkspaceStore<Session extends WorkspaceSession> = StoreApi<WorkspaceState<Session>>;

export interface WorkspaceDependencies<Session extends WorkspaceSession> {
  createSession: (startPath?: string) => Session;
  disposeSession: (session: Session) => void;
  currentPathOf: (session: Session) => string | undefined;
}

export function selectActiveSession<Session extends WorkspaceSession>(
  state: WorkspaceState<Session>,
): Session {
  const tab = activeTabOf(activePaneOf(state.workspace));
  return state.sessions[tab.sessionId];
}

export function createWorkspaceStore<Session extends WorkspaceSession>({
  createSession,
  disposeSession,
  currentPathOf,
}: WorkspaceDependencies<Session>): WorkspaceStore<Session> {
  let nextId = 0;
  const generateId = (prefix: string) => `${prefix}-${++nextId}`;

  const firstSession = createSession();
  const firstTab = { id: generateId("tab"), sessionId: firstSession.id };

  return createStore<WorkspaceState<Session>>((set, get) => {
    function openSession(startPath: string | undefined) {
      const session = createSession(startPath);
      return { session, tab: { id: generateId("tab"), sessionId: session.id } };
    }

    function pathOfActiveSession() {
      return currentPathOf(selectActiveSession(get()));
    }

    function apply(next: Workspace) {
      const { workspace, sessions } = get();
      if (next === workspace) return;

      const keptSessionIds = new Set(allTabs(next).map((tab) => tab.sessionId));
      const remaining = { ...sessions };
      for (const [sessionId, session] of Object.entries(sessions)) {
        if (keptSessionIds.has(sessionId)) continue;
        disposeSession(session);
        delete remaining[sessionId];
      }
      set({ workspace: next, sessions: remaining });
    }

    function addSessionTab(paneId: string, startPath: string | undefined) {
      const { session, tab } = openSession(startPath);
      const { workspace, sessions } = get();
      set({ workspace: addTab(workspace, paneId, tab), sessions: { ...sessions, [session.id]: session } });
    }

    return {
      workspace: createWorkspace(generateId("pane"), firstTab),
      sessions: { [firstSession.id]: firstSession },

      newTab: (paneId) => {
        addSessionTab(paneId ?? get().workspace.activePaneId, pathOfActiveSession());
      },

      duplicateTab: (tabId) => {
        const location = findTab(get().workspace, tabId);
        if (!location) return;
        set({ workspace: activateTab(get().workspace, tabId) });
        addSessionTab(location.pane.id, currentPathOf(get().sessions[location.tab.sessionId]));
      },

      closeTab: (tabId) => apply(closeTab(get().workspace, tabId)),
      closeOtherTabs: (tabId) => apply(closeOtherTabs(get().workspace, tabId)),
      activateTab: (tabId) => apply(activateTab(get().workspace, tabId)),
      activatePane: (paneId) => apply(activatePane(get().workspace, paneId)),
      cycleTab: (step) => apply(cycleTab(get().workspace, step)),
      activateTabAtPosition: (position) => apply(activateTabAtPosition(get().workspace, position)),
      reorderTab: (tabId, toIndex) => apply(reorderTab(get().workspace, tabId, toIndex)),
      moveTabToOtherPane: (tabId) => {
        const { workspace } = get();
        const location = findTab(workspace, tabId);
        if (!location) return;
        const target = otherPaneOf(workspace, location.pane.id);
        if (target) apply(moveTabToPane(workspace, tabId, target.id));
      },

      toggleSplit: () => {
        const { workspace, sessions } = get();
        if (isSplit(workspace)) {
          apply(unsplitWorkspace(workspace));
          return;
        }
        const { session, tab } = openSession(pathOfActiveSession());
        set({
          workspace: splitWorkspace(workspace, generateId("pane"), tab),
          sessions: { ...sessions, [session.id]: session },
        });
      },

      switchPane: () => {
        const { workspace } = get();
        const other = otherPaneOf(workspace, workspace.activePaneId);
        if (other) apply(activatePane(workspace, other.id));
      },

      setSplitRatio: (ratio) => apply(setSplitRatio(get().workspace, ratio)),
    };
  });
}
