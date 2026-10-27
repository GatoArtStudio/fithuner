import { beforeEach, describe, expect, it } from "vitest";
import {
  WORKSPACE_LAYOUT_STORAGE_KEY,
  createLocalStorageWorkspaceLayoutGateway,
} from "./local-storage-workspace-layout-gateway";

const layout = { panes: [{ paths: ["/a", "/b"], activeIndex: 1 }], activePaneIndex: 0, splitRatio: 0.4 };

describe("local storage workspace layout gateway", () => {
  beforeEach(() => localStorage.clear());

  it("saves, loads and clears the layout", () => {
    const gateway = createLocalStorageWorkspaceLayoutGateway();

    gateway.save(layout);
    expect(gateway.load()).toEqual(layout);

    gateway.clear();
    expect(gateway.load()).toBeNull();
  });

  it("returns null for nothing saved, broken JSON and invalid layouts", () => {
    const gateway = createLocalStorageWorkspaceLayoutGateway();
    expect(gateway.load()).toBeNull();

    localStorage.setItem(WORKSPACE_LAYOUT_STORAGE_KEY, "{not json");
    expect(gateway.load()).toBeNull();

    localStorage.setItem(WORKSPACE_LAYOUT_STORAGE_KEY, JSON.stringify({ panes: [] }));
    expect(gateway.load()).toBeNull();
  });

  it("does not throw when the storage is unavailable", () => {
    const gateway = createLocalStorageWorkspaceLayoutGateway(() => {
      throw new Error("blocked");
    });

    expect(() => gateway.save(layout)).not.toThrow();
    expect(() => gateway.clear()).not.toThrow();
    expect(gateway.load()).toBeNull();
  });
});
