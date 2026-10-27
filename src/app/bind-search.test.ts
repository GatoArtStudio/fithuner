import { describe, expect, it, vi } from "vitest";
import { createDirectoryBrowsingStore } from "../directory-browsing";
import { createSearchStore } from "../folder-search";
import { bindSearch } from "./bind-search";

function setup() {
  const directoryBrowsingStore = createDirectoryBrowsingStore({
    listDirectory: vi.fn().mockImplementation(async (path?: string) => ({
      path: path ?? "/home",
      parentPath: null,
      entries: [],
    })),
  });
  const searchStore = createSearchStore({
    gateway: { startSearch: vi.fn(), cancelSearch: vi.fn(), subscribe: vi.fn() },
    currentDirectoryPath: () => directoryBrowsingStore.getState().listing?.path ?? null,
  });
  bindSearch({ searchStore, directoryBrowsingStore });
  return { directoryBrowsingStore, searchStore };
}

describe("bindSearch", () => {
  it("closes the search when the user moves to another folder", async () => {
    const { directoryBrowsingStore, searchStore } = setup();
    await directoryBrowsingStore.getState().openDirectory("/home");
    searchStore.getState().open();

    await directoryBrowsingStore.getState().openDirectory("/home/docs");

    expect(searchStore.getState().isOpen).toBe(false);
  });

  it("keeps the search open when the same folder is refreshed", async () => {
    const { directoryBrowsingStore, searchStore } = setup();
    await directoryBrowsingStore.getState().openDirectory("/home");
    searchStore.getState().open();

    await directoryBrowsingStore.getState().refresh();

    expect(searchStore.getState().isOpen).toBe(true);
  });
});
