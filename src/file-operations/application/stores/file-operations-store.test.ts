import { describe, expect, it, vi } from "vitest";
import type { BatchOutcome } from "../../domain/entities/file-operation";
import type { FileOperationsGateway } from "../ports/file-operations-gateway";
import { createFileOperationsStore } from "./file-operations-store";

function setup(
  gatewayOverrides: Partial<FileOperationsGateway> = {},
  selected: string[] = [],
  confirmTrash = false,
  onCompleted = vi.fn(),
) {
  const gateway: FileOperationsGateway = {
    openEntry: vi.fn().mockResolvedValue(undefined),
    createEntry: vi.fn().mockResolvedValue("/docs/New folder"),
    renameEntry: vi.fn().mockResolvedValue("/docs/renamed.txt"),
    trashEntries: vi.fn().mockResolvedValue({ succeeded: selected, failed: [] }),
    deleteEntriesPermanently: vi.fn().mockResolvedValue({ succeeded: selected, failed: [] }),
    moveEntries: vi.fn().mockResolvedValue({ succeeded: [], failed: [] }),
    restoreEntries: vi.fn().mockResolvedValue({ succeeded: [], failed: [] }),
    ...gatewayOverrides,
  };
  const directory = {
    currentDirectoryPath: () => "/docs",
    selectedPaths: () => selected,
    refresh: vi.fn().mockResolvedValue(undefined),
    selectEntry: vi.fn(),
  };
  const notifyError = vi.fn();
  const store = createFileOperationsStore({
    gateway,
    directory,
    notifyError,
    shouldConfirmTrash: () => confirmTrash,
    onCompleted,
  });
  return { store, gateway, directory, notifyError, onCompleted };
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
    expect(store.getState().pendingDeletion).toEqual({ paths: ["/docs/a.txt"], mode: "permanent" });

    await store.getState().confirmDeletion();
    expect(gateway.deleteEntriesPermanently).toHaveBeenCalledWith(["/docs/a.txt"]);
    expect(store.getState().pendingDeletion).toBeNull();
  });

  it("does not ask for confirmation when nothing is selected", () => {
    const { store } = setup();

    store.getState().requestPermanentDelete();

    expect(store.getState().pendingDeletion).toBeNull();
  });

  it("asks for confirmation before trashing when the setting is on", async () => {
    const { store, gateway } = setup({}, ["/docs/a.txt"], true);

    await store.getState().trashSelected();
    expect(gateway.trashEntries).not.toHaveBeenCalled();
    expect(store.getState().pendingDeletion).toEqual({ paths: ["/docs/a.txt"], mode: "trash" });

    await store.getState().confirmDeletion();
    expect(gateway.trashEntries).toHaveBeenCalledWith(["/docs/a.txt"]);
    expect(gateway.deleteEntriesPermanently).not.toHaveBeenCalled();
  });

  it("does not delete anything when the confirmation is cancelled", async () => {
    const { store, gateway } = setup({}, ["/docs/a.txt"], true);
    await store.getState().trashSelected();

    store.getState().cancelDeletion();

    expect(store.getState().pendingDeletion).toBeNull();
    expect(gateway.trashEntries).not.toHaveBeenCalled();
  });

  describe("completed operations", () => {
    it("reports a created entry", async () => {
      const { store, onCompleted } = setup();

      await store.getState().createEntry("directory");

      expect(onCompleted).toHaveBeenCalledWith({ type: "created", path: "/docs/New folder" });
    });

    it("reports a rename with the old and the new path", async () => {
      const { store, onCompleted } = setup();
      store.getState().startRename("/docs/a.txt");

      await store.getState().commitRename("renamed.txt");

      expect(onCompleted).toHaveBeenCalledWith({ type: "renamed", from: "/docs/a.txt", to: "/docs/renamed.txt" });
    });

    it("does not report a rename that failed or changed nothing", async () => {
      const { store, onCompleted } = setup({
        renameEntry: vi.fn().mockRejectedValue({ kind: "alreadyExists", message: "Already exists" }),
      });
      store.getState().startRename("/docs/a.txt");

      await store.getState().commitRename("b.txt");
      await store.getState().commitRename("a.txt");

      expect(onCompleted).not.toHaveBeenCalled();
    });

    it("reports only the entries that really went to the trash", async () => {
      const { store, onCompleted } = setup(
        {
          trashEntries: vi.fn().mockResolvedValue({
            succeeded: ["/docs/a.txt"],
            failed: [{ path: "/docs/b.txt", error: { kind: "permissionDenied", message: "Permission denied" } }],
          }),
        },
        ["/docs/a.txt", "/docs/b.txt"],
      );

      await store.getState().trashSelected();

      expect(onCompleted).toHaveBeenCalledWith({ type: "trashed", paths: ["/docs/a.txt"] });
    });

    it("reports a confirmed trash but never a permanent deletion", async () => {
      const { store, onCompleted } = setup({}, ["/docs/a.txt"], true);

      await store.getState().trashSelected();
      expect(onCompleted).not.toHaveBeenCalled();
      await store.getState().confirmDeletion();
      expect(onCompleted).toHaveBeenCalledWith({ type: "trashed", paths: ["/docs/a.txt"] });

      onCompleted.mockClear();
      store.getState().requestPermanentDelete();
      await store.getState().confirmDeletion();
      expect(onCompleted).not.toHaveBeenCalled();
    });
  });
});
