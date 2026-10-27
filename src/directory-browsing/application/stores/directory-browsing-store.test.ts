import { describe, expect, it, vi } from "vitest";
import type { DirectoryListing } from "../../domain/entities/file-entry";
import { createDirectoryBrowsingStore } from "./directory-browsing-store";
import type { DirectoryGateway } from "../ports/directory-gateway";

function listingAt(path: string): DirectoryListing {
  return { path, parentPath: null, entries: [] };
}

function gatewayReturning(listing: DirectoryListing): DirectoryGateway {
  return { listDirectory: vi.fn().mockResolvedValue(listing) };
}

describe("directory browsing store", () => {
  it("loads a directory and resets the selection", async () => {
    const store = createDirectoryBrowsingStore(gatewayReturning(listingAt("/home")));
    store.getState().selectOnly("/old");

    const openedPath = await store.getState().openDirectory("/home");

    expect(openedPath).toBe("/home");
    expect(store.getState().listing?.path).toBe("/home");
    expect(store.getState().selectedPaths).toEqual([]);
    expect(store.getState().isLoading).toBe(false);
  });

  it("keeps the previous listing and exposes the error when loading fails", async () => {
    const gateway: DirectoryGateway = {
      listDirectory: vi
        .fn()
        .mockResolvedValueOnce(listingAt("/home"))
        .mockRejectedValueOnce({ kind: "permissionDenied", message: "Permission denied" }),
    };
    const store = createDirectoryBrowsingStore(gateway);
    await store.getState().openDirectory("/home");

    const openedPath = await store.getState().openDirectory("/root");

    expect(openedPath).toBeNull();
    expect(store.getState().listing?.path).toBe("/home");
    expect(store.getState().error?.kind).toBe("permissionDenied");
  });

  it("ignores a stale response when a newer request was made", async () => {
    let resolveSlow: (listing: DirectoryListing) => void = () => {};
    const gateway: DirectoryGateway = {
      listDirectory: vi
        .fn()
        .mockImplementationOnce(() => new Promise((resolve) => (resolveSlow = resolve)))
        .mockResolvedValueOnce(listingAt("/fast")),
    };
    const store = createDirectoryBrowsingStore(gateway);

    const slowRequest = store.getState().openDirectory("/slow");
    await store.getState().openDirectory("/fast");
    resolveSlow(listingAt("/slow"));

    expect(await slowRequest).toBeNull();
    expect(store.getState().listing?.path).toBe("/fast");
  });

  it("toggles the sort direction on the same key and resets it on a new key", () => {
    const store = createDirectoryBrowsingStore(gatewayReturning(listingAt("/")));

    store.getState().toggleSort("name");
    expect(store.getState().sort).toEqual({ key: "name", direction: "descending" });

    store.getState().toggleSort("size");
    expect(store.getState().sort).toEqual({ key: "size", direction: "ascending" });
  });

  it("toggles individual selections", () => {
    const store = createDirectoryBrowsingStore(gatewayReturning(listingAt("/")));

    store.getState().selectOnly("/a");
    store.getState().toggleSelection("/b");
    store.getState().toggleSelection("/a");

    expect(store.getState().selectedPaths).toEqual(["/b"]);
  });

  it("sets the hidden files visibility explicitly", () => {
    const store = createDirectoryBrowsingStore(gatewayReturning(listingAt("/")));

    store.getState().setShowHidden(true);

    expect(store.getState().showHidden).toBe(true);
  });

  describe("reload", () => {
    const entry = (name: string) => ({
      name,
      path: `/home/${name}`,
      kind: "file" as const,
      isSymlink: false,
      isHidden: false,
      sizeInBytes: 1,
      modifiedAtMillis: null,
    });

    it("updates the entries without showing the loading state and keeps the selection that still exists", async () => {
      const listDirectory = vi
        .fn()
        .mockResolvedValueOnce({ path: "/home", parentPath: null, entries: [entry("a"), entry("b")] })
        .mockResolvedValueOnce({ path: "/home", parentPath: null, entries: [entry("b"), entry("c")] });
      const store = createDirectoryBrowsingStore({ listDirectory });
      await store.getState().openDirectory("/home");
      store.getState().selectOnly("/home/a");
      store.getState().toggleSelection("/home/b");
      const loadingStates: boolean[] = [];
      store.subscribe((state) => loadingStates.push(state.isLoading));

      await store.getState().reload();

      expect(store.getState().listing?.entries.map((item) => item.name)).toEqual(["b", "c"]);
      expect(store.getState().selectedPaths).toEqual(["/home/b"]);
      expect(loadingStates).not.toContain(true);
    });

    it("does nothing before a folder is open", async () => {
      const gateway = gatewayReturning(listingAt("/home"));
      const store = createDirectoryBrowsingStore(gateway);

      await store.getState().reload();

      expect(gateway.listDirectory).not.toHaveBeenCalled();
    });

    it("drops a result that arrives after the user navigated elsewhere", async () => {
      let resolveReload: (listing: DirectoryListing) => void = () => {};
      const listDirectory = vi
        .fn()
        .mockResolvedValueOnce(listingAt("/home"))
        .mockImplementationOnce(() => new Promise<DirectoryListing>((resolve) => (resolveReload = resolve)))
        .mockResolvedValueOnce(listingAt("/other"));
      const store = createDirectoryBrowsingStore({ listDirectory });
      await store.getState().openDirectory("/home");

      const pending = store.getState().reload();
      await store.getState().openDirectory("/other");
      resolveReload(listingAt("/home"));
      await pending;

      expect(store.getState().listing?.path).toBe("/other");
    });

    it("exposes the error when the folder can no longer be read", async () => {
      const listDirectory = vi
        .fn()
        .mockResolvedValueOnce(listingAt("/home"))
        .mockRejectedValueOnce({ kind: "notFound", message: "gone" });
      const store = createDirectoryBrowsingStore({ listDirectory });
      await store.getState().openDirectory("/home");

      await store.getState().reload();

      expect(store.getState().error).toEqual({ kind: "notFound", message: "gone" });
      expect(store.getState().listing?.path).toBe("/home");
    });
  });
});
