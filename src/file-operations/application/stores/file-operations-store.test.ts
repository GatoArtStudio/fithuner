import { describe, expect, it, vi } from "vitest";
import type { BatchOutcome } from "../../domain/entities/file-operation";
import type { FileOperationsGateway } from "../ports/file-operations-gateway";
import { createFileOperationsStore } from "./file-operations-store";

function setup(gatewayOverrides: Partial<FileOperationsGateway> = {}, selected: string[] = []) {
  const gateway: FileOperationsGateway = {
    openEntry: vi.fn().mockResolvedValue(undefined),
    createEntry: vi.fn().mockResolvedValue("/docs/New folder"),
    renameEntry: vi.fn().mockResolvedValue("/docs/renamed.txt"),
    trashEntries: vi.fn().mockResolvedValue({ succeeded: selected, failed: [] }),
    deleteEntriesPermanently: vi.fn().mockResolvedValue({ succeeded: selected, failed: [] }),
    ...gatewayOverrides,
  };
  const directory = {
    currentDirectoryPath: () => "/docs",
    selectedPaths: () => selected,
    refresh: vi.fn().mockResolvedValue(undefined),
    selectEntry: vi.fn(),
  };
  const notifyError = vi.fn();
  const store = createFileOperationsStore({ gateway, directory, notifyError });
  return { store, gateway, directory, notifyError };
}

describe("file operations store", () => {
  it("creates an entry, selects it and starts renaming it", async () => {
    const { store, gateway, directory } = setup();

    await store.getState().createEntry("directory");

    expect(gateway.createEntry).toHaveBeenCalledWith("/docs", "directory");
    expect(directory.selectEntry).toHaveBeenCalledWith("/docs/New folder");
    expect(store.getState().renamingPath).toBe("/docs/New folder");
  });

  it("renames the entry and stops editing", async () => {
    const { store, directory } = setup();
    store.getState().startRename("/docs/a.txt");

    await store.getState().commitRename("renamed.txt");

    expect(directory.selectEntry).toHaveBeenCalledWith("/docs/renamed.txt");
    expect(store.getState().renamingPath).toBeNull();
  });

  it("keeps editing and shows the message when the name already exists", async () => {
    const { store } = setup({
      renameEntry: vi.fn().mockRejectedValue({ kind: "alreadyExists", message: "Already exists" }),
    });
    store.getState().startRename("/docs/a.txt");

    await store.getState().commitRename("b.txt");

    expect(store.getState().renamingPath).toBe("/docs/a.txt");
    expect(store.getState().renameError).toBe("Already exists");
  });

  it("validates the name locally before calling the backend", async () => {
    const { store, gateway } = setup();
    store.getState().startRename("/docs/a.txt");

    await store.getState().commitRename("bad/name");

    expect(gateway.renameEntry).not.toHaveBeenCalled();
    expect(store.getState().renameError).not.toBeNull();
  });

  it("stops editing without calling the backend when the name is unchanged", async () => {
    const { store, gateway } = setup();
    store.getState().startRename("/docs/a.txt");

    await store.getState().commitRename("a.txt");

    expect(gateway.renameEntry).not.toHaveBeenCalled();
    expect(store.getState().renamingPath).toBeNull();
  });

  it("starts renaming the last selected entry by default", () => {
    const { store } = setup({}, ["/docs/a.txt", "/docs/b.txt"]);

    store.getState().startRename();

    expect(store.getState().renamingPath).toBe("/docs/b.txt");
  });

  it("moves the selection to the trash and refreshes", async () => {
    const { store, gateway, directory } = setup({}, ["/docs/a.txt"]);

    await store.getState().trashSelected();

    expect(gateway.trashEntries).toHaveBeenCalledWith(["/docs/a.txt"]);
    expect(directory.refresh).toHaveBeenCalled();
  });

  it("reports the first failure of a batch with the number of extra failures", async () => {
    const outcome: BatchOutcome = {
      succeeded: [],
      failed: [
        { path: "/docs/a.txt", error: { kind: "permissionDenied", message: "Permission denied" } },
        { path: "/docs/b.txt", error: { kind: "notFound", message: "Missing" } },
      ],
    };
    const { store, notifyError } = setup(
      { trashEntries: vi.fn().mockResolvedValue(outcome) },
      ["/docs/a.txt", "/docs/b.txt"],
    );

    await store.getState().trashSelected();

    expect(notifyError).toHaveBeenCalledWith(
      'Could not move to trash "a.txt": Permission denied (and 1 more)',
    );
  });

  it("requires confirmation before deleting permanently", async () => {
    const { store, gateway } = setup({}, ["/docs/a.txt"]);

    store.getState().requestPermanentDelete();
    expect(gateway.deleteEntriesPermanently).not.toHaveBeenCalled();
    expect(store.getState().pendingPermanentDeletePaths).toEqual(["/docs/a.txt"]);

    await store.getState().confirmPermanentDelete();
    expect(gateway.deleteEntriesPermanently).toHaveBeenCalledWith(["/docs/a.txt"]);
    expect(store.getState().pendingPermanentDeletePaths).toBeNull();
  });

  it("does not ask for confirmation when nothing is selected", () => {
    const { store } = setup();

    store.getState().requestPermanentDelete();

    expect(store.getState().pendingPermanentDeletePaths).toBeNull();
  });
});
