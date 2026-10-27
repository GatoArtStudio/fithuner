import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSettingsStore } from "../settings";
import { createMemoryWorkspaceLayoutGateway, createWorkspaceStore, type WorkspaceLayout } from "../workspace";
import { startWorkspacePersistence } from "./bind-workspace-persistence";
import { createBrowsingSessionFactory, type BrowsingSession } from "./browsing-session";

const savedLayout: WorkspaceLayout = {
  panes: [
    { paths: ["/a", "/b"], activeIndex: 1 },
    { paths: ["/c"], activeIndex: 0 },
  ],
  activePaneIndex: 1,
  splitRatio: 0.3,
};

function setup(initial: WorkspaceLayout | null = null) {
  const settingsStore = createSettingsStore({
    gateway: { loadSettings: vi.fn(), saveSettings: vi.fn().mockImplementation(async (saved) => saved) },
    notifyError: vi.fn(),
  });
  const createSession = createBrowsingSessionFactory({
    settingsStore,
    directoryGateway: {
      listDirectory: vi.fn().mockImplementation(async (path?: string) => ({
        path: path ?? "/home",
        parentPath: null,
        entries: [],
      })),
    },
    searchGateway: { startSearch: vi.fn(), cancelSearch: vi.fn(), subscribe: vi.fn() },
  });
  const workspaceStore = createWorkspaceStore<BrowsingSession>({
    createSession,
    disposeSession: (session) => session.dispose(),
    currentPathOf: (session) => session.directoryBrowsingStore.getState().listing?.path,
  });
  const gateway = createMemoryWorkspaceLayoutGateway(initial);
  const stop = startWorkspacePersistence({ workspaceStore, settingsStore, gateway, debounceMillis: 500 });
  return { settingsStore, workspaceStore, gateway, stop };
}

describe("startWorkspacePersistence", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("restores the saved tabs, panes and ratio", async () => {
    const { workspaceStore } = setup(savedLayout);

    const { workspace, sessions } = workspaceStore.getState();
    expect(workspace.panes.map((pane) => pane.tabs.length)).toEqual([2, 1]);
    expect(workspace.splitRatio).toBe(0.3);
    expect(workspace.activePaneId).toBe(workspace.panes[1].id);
    await vi.waitFor(() => {
      const folders = Object.values(sessions).map((session) => session.directoryBrowsingStore.getState().listing?.path);
      expect(folders).toEqual(["/a", "/b", "/c"]);
    });
  });

  it("does not restore when the option is off, and forgets the saved layout", async () => {
    const settingsStore = createSettingsStore({
      gateway: { loadSettings: vi.fn(), saveSettings: vi.fn().mockImplementation(async (saved) => saved) },
      notifyError: vi.fn(),
    });
    await settingsStore.getState().update({ browsing: { restoreTabsOnStartup: false } });
    const workspaceStore = createWorkspaceStore<BrowsingSession>({
      createSession: createBrowsingSessionFactory({
        settingsStore,
        directoryGateway: { listDirectory: vi.fn().mockResolvedValue({ path: "/home", parentPath: null, entries: [] }) },
        searchGateway: { startSearch: vi.fn(), cancelSearch: vi.fn(), subscribe: vi.fn() },
      }),
      disposeSession: (session) => session.dispose(),
      currentPathOf: () => "/home",
    });
    const gateway = createMemoryWorkspaceLayoutGateway(savedLayout);
    startWorkspacePersistence({ workspaceStore, settingsStore, gateway });

    expect(workspaceStore.getState().workspace.panes).toHaveLength(1);

    workspaceStore.getState().newTab();
    await vi.advanceTimersByTimeAsync(500);
    expect(gateway.load()).toBeNull();
  });

  it("saves the layout after a short pause once folders are known", async () => {
    const { workspaceStore, gateway } = setup();
    await vi.waitFor(() => {
      const [session] = Object.values(workspaceStore.getState().sessions);
      expect(session.directoryBrowsingStore.getState().listing).not.toBeNull();
    });
    workspaceStore.getState().newTab();
    await vi.waitFor(() => {
      const sessions = Object.values(workspaceStore.getState().sessions);
      expect(sessions.every((session) => session.directoryBrowsingStore.getState().listing !== null)).toBe(true);
    });

    expect(gateway.load()).toBeNull();
    await vi.advanceTimersByTimeAsync(500);

    expect(gateway.load()).toEqual({
      panes: [{ paths: ["/home", "/home"], activeIndex: 1 }],
      activePaneIndex: 0,
      splitRatio: 0.5,
    });
  });

  it("clears the saved layout when the option is turned off and saves again when it is turned on", async () => {
    const { settingsStore, workspaceStore, gateway } = setup(savedLayout);
    await vi.waitFor(() => {
      const sessions = Object.values(workspaceStore.getState().sessions);
      expect(sessions.every((session) => session.directoryBrowsingStore.getState().listing !== null)).toBe(true);
    });
    await vi.advanceTimersByTimeAsync(500);
    expect(gateway.load()).not.toBeNull();

    await settingsStore.getState().update({ browsing: { restoreTabsOnStartup: false } });
    expect(gateway.load()).toBeNull();

    await settingsStore.getState().update({ browsing: { restoreTabsOnStartup: true } });
    expect(gateway.load()?.panes).toHaveLength(2);
  });

  it("stops saving after it is stopped", async () => {
    const { workspaceStore, gateway, stop } = setup();
    stop();

    workspaceStore.getState().newTab();
    await vi.advanceTimersByTimeAsync(1000);

    expect(gateway.load()).toBeNull();
  });
});
