import { describe, expect, it, vi } from "vitest";
import { createSettingsStore } from "../settings";
import { createBrowsingSessionFactory } from "./browsing-session";

function setup() {
  const settingsStore = createSettingsStore({
    gateway: { loadSettings: vi.fn(), saveSettings: vi.fn().mockImplementation(async (saved) => saved) },
    notifyError: vi.fn(),
  });
  const cancelSearch = vi.fn();
  const createSession = createBrowsingSessionFactory({
    settingsStore,
    directoryGateway: {
      listDirectory: vi.fn().mockImplementation(async (path?: string) => ({
        path: path ?? "/home/ana",
        parentPath: null,
        entries: [],
      })),
    },
    searchGateway: { startSearch: vi.fn().mockResolvedValue("search-1"), cancelSearch, subscribe: vi.fn() },
  });
  return { settingsStore, createSession, cancelSearch };
}

const folderOf = (session: { directoryBrowsingStore: { getState: () => { listing: { path: string } | null } } }) =>
  session.directoryBrowsingStore.getState().listing?.path;

describe("browsing session", () => {
  it("opens the start path, or the home folder without one", async () => {
    const { createSession } = setup();

    const home = createSession();
    const data = createSession("/data");

    await vi.waitFor(() => expect(folderOf(home)).toBe("/home/ana"));
    await vi.waitFor(() => expect(folderOf(data)).toBe("/data"));
  });

  it("keeps the folder, history and selection of each session independent", async () => {
    const { createSession } = setup();
    const first = createSession("/a");
    const second = createSession("/b");
    await vi.waitFor(() => expect(folderOf(second)).toBe("/b"));

    await first.navigationStore.getState().navigateTo("/a/inner");
    first.directoryBrowsingStore.getState().selectOnly("/a/inner/file");

    expect(folderOf(first)).toBe("/a/inner");
    expect(folderOf(second)).toBe("/b");
    expect(second.navigationStore.getState().history.paths).toEqual(["/b"]);
    expect(second.directoryBrowsingStore.getState().selectedPaths).toEqual([]);
  });

  it("closes only its own search when its folder changes", async () => {
    const { createSession } = setup();
    const first = createSession("/a");
    const second = createSession("/b");
    await vi.waitFor(() => expect(folderOf(second)).toBe("/b"));
    first.searchStore.getState().open();
    second.searchStore.getState().open();

    await first.navigationStore.getState().navigateTo("/a/inner");

    expect(first.searchStore.getState().isOpen).toBe(false);
    expect(second.searchStore.getState().isOpen).toBe(true);
  });

  it("applies the show hidden setting to every session, including new ones", async () => {
    const { createSession, settingsStore } = setup();
    const first = createSession();
    const second = createSession();

    await settingsStore.getState().update({ browsing: { showHiddenFiles: true } });

    expect(first.directoryBrowsingStore.getState().showHidden).toBe(true);
    expect(second.directoryBrowsingStore.getState().showHidden).toBe(true);
    expect(createSession().directoryBrowsingStore.getState().showHidden).toBe(true);
  });

  it("stops following the settings and closes its search when disposed", async () => {
    const { createSession, settingsStore } = setup();
    const session = createSession();
    session.searchStore.getState().open();

    session.dispose();
    await settingsStore.getState().update({ browsing: { showHiddenFiles: true } });

    expect(session.searchStore.getState().isOpen).toBe(false);
    expect(session.directoryBrowsingStore.getState().showHidden).toBe(false);
  });
});
