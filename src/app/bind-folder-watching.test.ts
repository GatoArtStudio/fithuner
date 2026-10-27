import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSettingsStore } from "../settings";
import { createWorkspaceStore } from "../workspace";
import { bindFolderWatching } from "./bind-folder-watching";
import { createBrowsingSessionFactory, type BrowsingSession } from "./browsing-session";

function setup() {
  const settingsStore = createSettingsStore({
    gateway: { loadSettings: vi.fn(), saveSettings: vi.fn().mockImplementation(async (saved) => saved) },
    notifyError: vi.fn(),
  });
  const listDirectory = vi.fn().mockImplementation(async (path?: string) => ({
    path: path ?? "/home",
    parentPath: null,
    entries: [],
  }));
  const createSession = createBrowsingSessionFactory({
    settingsStore,
    directoryGateway: { listDirectory },
    searchGateway: { startSearch: vi.fn(), cancelSearch: vi.fn(), subscribe: vi.fn() },
  });
  const workspaceStore = createWorkspaceStore<BrowsingSession>({
    createSession,
    disposeSession: (session) => session.dispose(),
    currentPathOf: (session) => session.directoryBrowsingStore.getState().listing?.path,
  });
  const gateway = { watch: vi.fn().mockResolvedValue(undefined), subscribe: vi.fn() };
  const binding = bindFolderWatching({ workspaceStore, settingsStore, gateway, debounceMillis: 100 });
  return { settingsStore, workspaceStore, gateway, binding, listDirectory };
}

const lastWatched = (gateway: ReturnType<typeof setup>["gateway"]) =>
  gateway.watch.mock.calls[gateway.watch.mock.calls.length - 1]?.[0];

describe("bindFolderWatching", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("watches the folder every session shows, without duplicates", async () => {
    const { workspaceStore, gateway } = setup();
    await vi.waitFor(() => expect(lastWatched(gateway)).toEqual(["/home"]));

    workspaceStore.getState().newTab();
    await vi.waitFor(() => expect(Object.values(workspaceStore.getState().sessions)).toHaveLength(2));
    const [, second] = Object.values(workspaceStore.getState().sessions);
    await second.navigationStore.getState().navigateTo("/data");

    await vi.waitFor(() => expect(lastWatched(gateway)).toEqual(["/data", "/home"]));
  });

  it("stops watching a folder when its tab closes", async () => {
    const { workspaceStore, gateway } = setup();
    workspaceStore.getState().newTab();
    const [first, second] = Object.values(workspaceStore.getState().sessions);
    await second.navigationStore.getState().navigateTo("/data");
    await vi.waitFor(() => expect(lastWatched(gateway)).toEqual(["/data", "/home"]));
    const secondTab = workspaceStore.getState().workspace.panes[0].tabs.find((tab) => tab.sessionId === second.id)!;

    workspaceStore.getState().closeTab(secondTab.id);

    expect(first.id).not.toBe(second.id);
    await vi.waitFor(() => expect(lastWatched(gateway)).toEqual(["/home"]));
  });

  it("watches nothing while the setting is off and resumes when it is turned on", async () => {
    const { settingsStore, gateway } = setup();
    await vi.waitFor(() => expect(lastWatched(gateway)).toEqual(["/home"]));

    await settingsStore.getState().update({ browsing: { watchFolders: false } });
    expect(lastWatched(gateway)).toEqual([]);

    await settingsStore.getState().update({ browsing: { watchFolders: true } });
    expect(lastWatched(gateway)).toEqual(["/home"]);
  });

  it("reloads the sessions showing the changed folder once for a burst of events", async () => {
    const { workspaceStore, binding, listDirectory } = setup();
    workspaceStore.getState().newTab();
    const [first, second] = Object.values(workspaceStore.getState().sessions);
    await second.navigationStore.getState().navigateTo("/data");
    await vi.waitFor(() => expect(first.directoryBrowsingStore.getState().listing?.path).toBe("/home"));
    listDirectory.mockClear();

    binding.handleFolderChanged("/home");
    binding.handleFolderChanged("/home");
    expect(listDirectory).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(100);

    expect(listDirectory).toHaveBeenCalledTimes(1);
    expect(listDirectory).toHaveBeenCalledWith("/home");
  });

  it("ignores changes of folders nobody shows", async () => {
    const { binding, listDirectory, workspaceStore } = setup();
    await vi.waitFor(() => {
      const [session] = Object.values(workspaceStore.getState().sessions);
      expect(session.directoryBrowsingStore.getState().listing).not.toBeNull();
    });
    listDirectory.mockClear();

    binding.handleFolderChanged("/elsewhere");
    await vi.advanceTimersByTimeAsync(100);
    expect(listDirectory).not.toHaveBeenCalled();
  });
});
