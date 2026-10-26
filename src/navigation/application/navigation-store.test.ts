import { describe, expect, it, vi } from "vitest";
import { currentPath } from "../domain/navigation-history";
import { createNavigationStore } from "./navigation-store";

function createStoreWith(openDirectory: (path?: string) => Promise<string | null>) {
  return createNavigationStore({
    placesGateway: { listPlaces: vi.fn().mockResolvedValue([]) },
    openDirectory,
  });
}

const echoOpen = async (path?: string) => path ?? "/home";

describe("navigation store", () => {
  it("records the resolved path of the opened directory", async () => {
    const store = createStoreWith(echoOpen);

    await store.getState().navigateTo(undefined);

    expect(currentPath(store.getState().history)).toBe("/home");
  });

  it("does not record the path when opening fails", async () => {
    const store = createStoreWith(vi.fn().mockResolvedValue(null));

    await store.getState().navigateTo("/forbidden");

    expect(store.getState().history.paths).toEqual([]);
  });

  it("goes back and forward through the history", async () => {
    const openDirectory = vi.fn(echoOpen);
    const store = createStoreWith(openDirectory);
    await store.getState().navigateTo("/a");
    await store.getState().navigateTo("/b");

    await store.getState().goBack();
    expect(currentPath(store.getState().history)).toBe("/a");
    expect(openDirectory).toHaveBeenLastCalledWith("/a");

    await store.getState().goForward();
    expect(currentPath(store.getState().history)).toBe("/b");
  });

  it("keeps the history position when going back fails", async () => {
    const openDirectory = vi
      .fn<(path?: string) => Promise<string | null>>()
      .mockImplementationOnce(echoOpen)
      .mockImplementationOnce(echoOpen)
      .mockResolvedValueOnce(null);
    const store = createStoreWith(openDirectory);
    await store.getState().navigateTo("/a");
    await store.getState().navigateTo("/b");

    await store.getState().goBack();

    expect(currentPath(store.getState().history)).toBe("/b");
  });

  it("loads the places and falls back to an empty list on failure", async () => {
    const store = createNavigationStore({
      placesGateway: { listPlaces: vi.fn().mockRejectedValue(new Error("boom")) },
      openDirectory: echoOpen,
    });

    await store.getState().loadPlaces();

    expect(store.getState().places).toEqual([]);
  });
});
