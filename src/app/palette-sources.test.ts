import { describe, expect, it, vi } from "vitest";
import { createUpdatesStore } from "../app-updates";
import { createDirectoryBrowsingStore } from "../directory-browsing";
import { createFileClipboardStore } from "../file-clipboard";
import { createFileOperationsStore } from "../file-operations";
import { createPreviewStore } from "../file-preview";
import { createSearchStore } from "../folder-search";
import { createNavigationStore, createPlacesStore } from "../navigation";
import { createSettingsStore } from "../settings";
import { buildPaletteItems, type PaletteStores } from "./palette-sources";

async function createStores() {
  const directoryBrowsingStore = createDirectoryBrowsingStore({
    listDirectory: vi.fn().mockImplementation(async (path?: string) => ({
      path: path ?? "/home/ana",
      parentPath: "/home",
      entries: [],
    })),
  });
  const placesStore = createPlacesStore({
    placesGateway: {
      listPlaces: async () => [
        { label: "Home", path: "/home/ana", kind: "home" },
        { label: "Documents", path: "/home/ana/Documents", kind: "documents" },
      ],
    },
  });
  const navigationStore = createNavigationStore({
    openDirectory: directoryBrowsingStore.getState().openDirectory,
  });
  const directory = {
    currentDirectoryPath: () => directoryBrowsingStore.getState().listing?.path ?? null,
    selectedPaths: () => directoryBrowsingStore.getState().selectedPaths,
    refresh: async () => {},
    selectEntry: () => {},
  };
  const searchStore = createSearchStore({
    gateway: { startSearch: vi.fn().mockResolvedValue("s1"), cancelSearch: vi.fn(), subscribe: vi.fn() },
    currentDirectoryPath: () => directoryBrowsingStore.getState().listing?.path ?? null,
  });
  const session = { directoryBrowsingStore, navigationStore, searchStore };
  const stores: PaletteStores = {
    activeSession: () => session,
    placesStore,
    fileOperationsStore: createFileOperationsStore({
      gateway: {
        openEntry: vi.fn(),
        createEntry: vi.fn().mockResolvedValue("/home/ana/New folder"),
        renameEntry: vi.fn(),
        trashEntries: vi.fn().mockResolvedValue({ succeeded: [], failed: [] }),
        deleteEntriesPermanently: vi.fn(),
      },
      directory,
      notifyError: vi.fn(),
    }),
    fileClipboardStore: createFileClipboardStore({
      gateway: { placeFiles: vi.fn(), readFiles: vi.fn(), clearCutMarker: vi.fn() },
      directory,
      startTransfer: vi.fn(),
      notifyError: vi.fn(),
    }),
    settingsStore: createSettingsStore({
      gateway: { loadSettings: vi.fn(), saveSettings: vi.fn().mockImplementation(async (saved) => saved) },
      notifyError: vi.fn(),
    }),
    previewStore: createPreviewStore(),
    updatesStore: createUpdatesStore({
      gateway: {
        checkForUpdate: vi.fn().mockResolvedValue({ currentVersion: "0.1.0", available: null }),
        startDownload: vi.fn(),
        installAndRestart: vi.fn(),
        openReleasePage: vi.fn(),
        subscribeToDownload: vi.fn(),
      },
      shouldCheckOnStartup: () => true,
      shouldDownloadAutomatically: () => false,
    }),
  };
  await placesStore.getState().load();
  await navigationStore.getState().navigateTo("/home/ana");
  return { ...stores, ...session };
}

const titles = (items: { title: string }[]) => items.map((item) => item.title);
const find = (items: { id: string; run: () => void }[], id: string) => items.find((item) => item.id === id);

describe("buildPaletteItems", () => {
  it("offers the commands that do not need a selection", async () => {
    const stores = await createStores();

    const items = titles(buildPaletteItems(stores, ""));

    expect(items).toEqual(expect.arrayContaining(["New folder", "New file", "Paste", "Refresh", "Show hidden files", "Search in this folder", "Open settings", "Check for updates"]));
    expect(items).not.toContain("Rename");
    expect(items).not.toContain("Move to trash");
    expect(items).not.toContain("Go back");
  });

  it("adds the selection commands once something is selected", async () => {
    const stores = await createStores();
    stores.directoryBrowsingStore.getState().selectOnly("/home/ana/a.txt");

    const items = titles(buildPaletteItems(stores, ""));

    expect(items).toEqual(expect.arrayContaining(["Rename", "Move to trash", "Delete permanently", "Copy", "Cut", "Quick Look"]));
  });

  it("only offers Quick Look for a single selected entry", async () => {
    const stores = await createStores();
    stores.directoryBrowsingStore.getState().selectOnly("/a");
    stores.directoryBrowsingStore.getState().toggleSelection("/b");

    expect(titles(buildPaletteItems(stores, ""))).not.toContain("Quick Look");
  });

  it("hides the file commands while a search is open so they cannot act on hidden selections", async () => {
    const stores = await createStores();
    stores.directoryBrowsingStore.getState().selectOnly("/home/ana/a.txt");
    stores.searchStore.getState().open();

    const items = titles(buildPaletteItems(stores, ""));

    expect(items).not.toContain("Move to trash");
    expect(items).not.toContain("New folder");
    expect(items).toContain("Open settings");
  });

  it("names the hidden files command after what it will do", async () => {
    const stores = await createStores();

    expect(titles(buildPaletteItems(stores, ""))).toContain("Show hidden files");
    stores.directoryBrowsingStore.getState().toggleShowHidden();
    expect(titles(buildPaletteItems(stores, ""))).toContain("Hide hidden files");
  });

  it("offers back and forward only when the history allows it", async () => {
    const stores = await createStores();
    await stores.navigationStore.getState().navigateTo("/home/ana/Documents");

    let items = titles(buildPaletteItems(stores, ""));
    expect(items).toContain("Go back");
    expect(items).not.toContain("Go forward");

    await stores.navigationStore.getState().goBack();
    items = titles(buildPaletteItems(stores, ""));
    expect(items).toContain("Go forward");
  });

  it("lists places and recent folders without duplicating either", async () => {
    const stores = await createStores();
    await stores.navigationStore.getState().navigateTo("/data/projects");
    await stores.navigationStore.getState().navigateTo("/home/ana/Documents");
    await stores.navigationStore.getState().navigateTo("/data/projects");
    await stores.navigationStore.getState().navigateTo("/srv/www");
    await stores.navigationStore.getState().navigateTo("/home/ana");

    const places = buildPaletteItems(stores, "").filter((item) => item.group === "places");

    expect(titles(places)).toEqual(["Go to Home", "Go to Documents", "Go to www", "Go to projects"]);
    expect(places.find((item) => item.title === "Go to projects")?.subtitle).toBe("Recent · /data/projects");
  });

  it("runs a place by navigating to it", async () => {
    const stores = await createStores();

    find(buildPaletteItems(stores, ""), "place:/home/ana/Documents")?.run();

    await vi.waitFor(() => expect(stores.directoryBrowsingStore.getState().listing?.path).toBe("/home/ana/Documents"));
  });

  it("offers to go to a typed path and expands the tilde with the home folder", async () => {
    const stores = await createStores();

    const [first] = buildPaletteItems(stores, "~/Pictures");
    first.run();

    expect(first).toMatchObject({ title: "Go to /home/ana/Pictures", group: "go-to-path" });
    await vi.waitFor(() => expect(stores.directoryBrowsingStore.getState().listing?.path).toBe("/home/ana/Pictures"));
  });

  it("offers to search for typed text that is not a path", async () => {
    const stores = await createStores();

    const items = buildPaletteItems(stores, "report");
    const searchItem = items.find((item) => item.group === "search");
    searchItem?.run();

    expect(searchItem?.title).toBe("Search for “report” in ana");
    expect(stores.searchStore.getState()).toMatchObject({ isOpen: true, text: "report" });
    expect(items.some((item) => item.group === "go-to-path")).toBe(false);
  });

  it("does not offer typed-text entries for an empty query", async () => {
    const stores = await createStores();

    const groups = new Set(buildPaletteItems(stores, "   ").map((item) => item.group));

    expect(groups.has("search")).toBe(false);
    expect(groups.has("go-to-path")).toBe(false);
  });

  it("opens the updates section and checks for updates", async () => {
    const stores = await createStores();

    find(buildPaletteItems(stores, ""), "command:updates")?.run();

    expect(stores.settingsStore.getState()).toMatchObject({ isOpen: true, activeSection: "updates" });
    await vi.waitFor(() => expect(stores.updatesStore.getState().status.type).toBe("up-to-date"));
  });

  it("hides the preview commands when the preview is turned off", async () => {
    const stores = await createStores();
    await stores.settingsStore.getState().update({ preview: { panelEnabled: false } });
    stores.directoryBrowsingStore.getState().selectOnly("/home/ana/a.txt");

    const items = titles(buildPaletteItems(stores, ""));

    expect(items).not.toContain("Toggle preview panel");
    expect(items).not.toContain("Quick Look");
  });
});
