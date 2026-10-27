import { beforeEach, describe, expect, it, vi } from "vitest";

const invoke = vi.hoisted(() => vi.fn());

vi.mock("@tauri-apps/api/core", () => ({ invoke }));
vi.mock("@tauri-apps/api/event", () => ({ listen: vi.fn(async () => () => {}) }));
vi.mock("@tauri-apps/api/webview", () => ({
  getCurrentWebview: () => ({ onDragDropEvent: vi.fn(async () => () => {}) }),
}));

import { composeApplication } from "./composition-root";

function listingCalls() {
  return invoke.mock.calls.filter(([command]) => command === "list_directory");
}

beforeEach(() => {
  invoke.mockReset();
  invoke.mockImplementation(async (command: string, args?: { path?: string; parentPath?: string }) => {
    if (command === "list_directory") return { path: args?.path ?? "/home/ana", parentPath: null, entries: [] };
    if (command === "create_entry") return `${args?.parentPath}/New folder`;
    return undefined;
  });
});

describe("composeApplication with several sessions", () => {
  it("creates entries in the folder of the active session", async () => {
    const application = composeApplication();
    application.workspaceStore.getState().newTab();
    const second = Object.values(application.workspaceStore.getState().sessions)[1];
    await second.navigationStore.getState().navigateTo("/data");

    await application.fileOperationsStore.getState().createEntry("directory");

    expect(invoke).toHaveBeenCalledWith("create_entry", { parentPath: "/data", kind: "directory" });
  });

  it("refreshes every session after a change", async () => {
    const application = composeApplication();
    application.workspaceStore.getState().newTab();
    await vi.waitFor(() => expect(listingCalls()).toHaveLength(2));
    const callsBefore = listingCalls().length;

    await application.fileOperationsStore.getState().createEntry("file");

    expect(listingCalls().length - callsBefore).toBe(2);
  });

  it("records file operations so they can be undone", async () => {
    invoke.mockImplementation(async (command: string, args?: { path?: string; parentPath?: string }) => {
      if (command === "list_directory") return { path: args?.path ?? "/home/ana", parentPath: null, entries: [] };
      if (command === "create_entry") return `${args?.parentPath}/New folder`;
      if (command === "trash_entries") return { succeeded: ["/home/ana/New folder"], failed: [] };
      return undefined;
    });
    const application = composeApplication();
    await vi.waitFor(() => expect(listingCalls()).toHaveLength(1));

    await application.fileOperationsStore.getState().createEntry("directory");
    await application.undoStore.getState().undo();

    expect(invoke).toHaveBeenCalledWith("trash_entries", { paths: ["/home/ana/New folder"] });
    expect(application.undoStore.getState().history.redoable).toHaveLength(1);
  });
});
