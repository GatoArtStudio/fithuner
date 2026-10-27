import { describe, expect, it, vi } from "vitest";
import { activePaneOf, activeTabOf } from "../../domain/services/workspace-queries";
import { createWorkspaceStore, selectActiveSession } from "./workspace-store";

interface FakeSession {
  id: string;
  startPath?: string;
  path?: string;
}

function createFakeStore() {
  let counter = 0;
  const created: FakeSession[] = [];
  const disposed: string[] = [];
  const store = createWorkspaceStore<FakeSession>({
    createSession: (startPath) => {
      const session = { id: `s${++counter}`, startPath, path: startPath ?? "/home" };
      created.push(session);
      return session;
    },
    disposeSession: (session) => void disposed.push(session.id),
    currentPathOf: (session) => session.path,
  });
  return { store, created, disposed };
}

const tabIds = (state: ReturnType<ReturnType<typeof createFakeStore>["store"]["getState"]>) =>
  state.workspace.panes.map((pane) => pane.tabs.map((tab) => tab.sessionId));

describe("workspace store", () => {
  it("starts with one pane, one tab and one session", () => {
    const { store, created } = createFakeStore();

    expect(tabIds(store.getState())).toEqual([["s1"]]);
    expect(created).toHaveLength(1);
    expect(selectActiveSession(store.getState()).id).toBe("s1");
  });

  it("opens a new tab at the folder of the active session", () => {
    const { store, created } = createFakeStore();
    store.getState().sessions.s1.path = "/data";

    store.getState().newTab();

    expect(created[1].startPath).toBe("/data");
    expect(selectActiveSession(store.getState()).id).toBe("s2");
  });

  it("duplicates a tab at its own folder next to it", () => {
    const { store, created } = createFakeStore();
    store.getState().newTab();
    store.getState().sessions.s1.path = "/first";
    const firstTabId = store.getState().workspace.panes[0].tabs[0].id;

    store.getState().duplicateTab(firstTabId);

    expect(created[2].startPath).toBe("/first");
    expect(tabIds(store.getState())).toEqual([["s1", "s3", "s2"]]);
  });

  it("disposes a session exactly once when its tab closes", () => {
    const { store, disposed } = createFakeStore();
    store.getState().newTab();
    const [first] = store.getState().workspace.panes[0].tabs;

    store.getState().closeTab(first.id);
    store.getState().closeTab(first.id);

    expect(disposed).toEqual(["s1"]);
    expect(Object.keys(store.getState().sessions)).toEqual(["s2"]);
  });

  it("never closes the last tab of the only pane", () => {
    const { store, disposed } = createFakeStore();

    store.getState().closeTab(store.getState().workspace.panes[0].tabs[0].id);

    expect(disposed).toEqual([]);
    expect(tabIds(store.getState())).toEqual([["s1"]]);
  });

  it("disposes the other sessions when closing the other tabs", () => {
    const { store, disposed } = createFakeStore();
    store.getState().newTab();
    store.getState().newTab();
    const keep = store.getState().workspace.panes[0].tabs[0];

    store.getState().closeOtherTabs(keep.id);

    expect(disposed.sort()).toEqual(["s2", "s3"]);
    expect(tabIds(store.getState())).toEqual([["s1"]]);
  });

  describe("split", () => {
    it("opens a second pane with a session at the active folder and merges back without disposing", () => {
      const { store, created, disposed } = createFakeStore();
      store.getState().sessions.s1.path = "/data";

      store.getState().toggleSplit();

      expect(tabIds(store.getState())).toEqual([["s1"], ["s2"]]);
      expect(created[1].startPath).toBe("/data");
      expect(store.getState().workspace.activePaneId).toBe(store.getState().workspace.panes[1].id);

      store.getState().toggleSplit();

      expect(tabIds(store.getState())).toEqual([["s1", "s2"]]);
      expect(disposed).toEqual([]);
    });

    it("switches the active pane and moves tabs to the other pane", () => {
      const { store } = createFakeStore();
      store.getState().newTab();
      store.getState().toggleSplit();
      const [firstPane, secondPane] = store.getState().workspace.panes;

      store.getState().switchPane();
      expect(store.getState().workspace.activePaneId).toBe(firstPane.id);

      store.getState().moveTabToOtherPane(firstPane.tabs[0].id);
      expect(tabIds(store.getState())).toEqual([["s2"], ["s3", "s1"]]);
      expect(store.getState().workspace.activePaneId).toBe(secondPane.id);
    });

    it("closes the pane and its session when its last tab closes", () => {
      const { store, disposed } = createFakeStore();
      store.getState().toggleSplit();
      const secondTab = store.getState().workspace.panes[1].tabs[0];

      store.getState().closeTab(secondTab.id);

      expect(disposed).toEqual(["s2"]);
      expect(store.getState().workspace.panes).toHaveLength(1);
    });

    it("ignores switching panes without a split", () => {
      const { store } = createFakeStore();
      const before = store.getState().workspace;

      store.getState().switchPane();

      expect(store.getState().workspace).toBe(before);
    });
  });

  it("changes the active tab by cycling, position and id", () => {
    const { store } = createFakeStore();
    store.getState().newTab();
    store.getState().newTab();
    const activeSessionId = () => selectActiveSession(store.getState()).id;

    store.getState().activateTabAtPosition(1);
    expect(activeSessionId()).toBe("s1");
    store.getState().cycleTab(-1);
    expect(activeSessionId()).toBe("s3");
    store.getState().activateTab(store.getState().workspace.panes[0].tabs[1].id);
    expect(activeSessionId()).toBe("s2");
  });

  it("reorders tabs and keeps the active one", () => {
    const { store } = createFakeStore();
    store.getState().newTab();
    const [first] = store.getState().workspace.panes[0].tabs;

    store.getState().reorderTab(first.id, 1);

    expect(tabIds(store.getState())).toEqual([["s2", "s1"]]);
    const pane = activePaneOf(store.getState().workspace);
    expect(activeTabOf(pane).sessionId).toBe("s2");
  });

  it("clamps the split ratio", () => {
    const { store } = createFakeStore();
    const listener = vi.fn();
    store.subscribe(listener);

    store.getState().setSplitRatio(0.95);

    expect(store.getState().workspace.splitRatio).toBe(0.8);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
