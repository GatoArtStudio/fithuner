import { createStore, type StoreApi } from "zustand/vanilla";
import type {
  BatchOutcome,
  EntryReference,
  FileOperationError,
  NewEntryKind,
} from "../../domain/entities/file-operation";
import { fileNameOf, validateEntryName } from "../../domain/services/validate-entry-name";
import type { FileOperationsGateway } from "../ports/file-operations-gateway";

export interface ContextMenuRequest {
  target: EntryReference | null;
  x: number;
  y: number;
}

export interface PendingDeletion {
  paths: string[];
  mode: "trash" | "permanent";
}

export interface FileOperationsState {
  renamingPath: string | null;
  renameError: string | null;
  pendingDeletion: PendingDeletion | null;
  contextMenu: ContextMenuRequest | null;
  openEntry: (path: string) => Promise<void>;
  createEntry: (kind: NewEntryKind) => Promise<void>;
  startRename: (path?: string) => void;
  cancelRename: () => void;
  commitRename: (newName: string) => Promise<void>;
  trashSelected: () => Promise<void>;
  requestPermanentDelete: () => void;
  confirmDeletion: () => Promise<void>;
  cancelDeletion: () => void;
  openContextMenu: (request: ContextMenuRequest) => void;
  closeContextMenu: () => void;
}

export type FileOperationsStore = StoreApi<FileOperationsState>;

export interface FileOperationsDependencies {
  gateway: FileOperationsGateway;
  directory: {
    currentDirectoryPath: () => string | null;
    selectedPaths: () => string[];
    refresh: () => Promise<void>;
    selectEntry: (path: string) => void;
  };
  notifyError: (message: string) => void;
  shouldConfirmTrash?: () => boolean;
}

function toFileOperationError(failure: unknown): FileOperationError {
  if (typeof failure === "object" && failure !== null && "kind" in failure && "message" in failure) {
    return failure as FileOperationError;
  }
  return { kind: "unexpected", message: "Something went wrong" };
}

export function createFileOperationsStore({
  gateway,
  directory,
  notifyError,
  shouldConfirmTrash = () => false,
}: FileOperationsDependencies): FileOperationsStore {
  function reportFailures(action: string, outcome: BatchOutcome) {
    const [firstFailure] = outcome.failed;
    if (!firstFailure) return;
    const extraCount = outcome.failed.length - 1;
    const suffix = extraCount > 0 ? ` (and ${extraCount} more)` : "";
    notifyError(`Could not ${action} "${fileNameOf(firstFailure.path)}": ${firstFailure.error.message}${suffix}`);
  }

  async function removeEntries(
    action: string,
    paths: string[],
    remove: (paths: string[]) => Promise<BatchOutcome>,
  ) {
    try {
      reportFailures(action, await remove(paths));
    } catch (failure) {
      notifyError(toFileOperationError(failure).message);
    }
    await directory.refresh();
  }

  return createStore<FileOperationsState>((set, get) => ({
    renamingPath: null,
    renameError: null,
    pendingDeletion: null,
    contextMenu: null,

    openEntry: async (path) => {
      try {
        await gateway.openEntry(path);
      } catch (failure) {
        notifyError(toFileOperationError(failure).message);
      }
    },

    createEntry: async (kind) => {
      const parentPath = directory.currentDirectoryPath();
      if (parentPath === null) return;
      try {
        const createdPath = await gateway.createEntry(parentPath, kind);
        await directory.refresh();
        directory.selectEntry(createdPath);
        set({ renamingPath: createdPath, renameError: null });
      } catch (failure) {
        notifyError(toFileOperationError(failure).message);
      }
    },

    startRename: (path) => {
      const selectedPaths = directory.selectedPaths();
      const target = path ?? selectedPaths[selectedPaths.length - 1];
      if (target) set({ renamingPath: target, renameError: null });
    },

    cancelRename: () => set({ renamingPath: null, renameError: null }),

    commitRename: async (newName) => {
      const path = get().renamingPath;
      if (path === null) return;
      if (newName === fileNameOf(path)) {
        set({ renamingPath: null, renameError: null });
        return;
      }
      const invalidReason = validateEntryName(newName);
      if (invalidReason) {
        set({ renameError: invalidReason });
        return;
      }

      try {
        const renamedPath = await gateway.renameEntry(path, newName);
        await directory.refresh();
        directory.selectEntry(renamedPath);
        set({ renamingPath: null, renameError: null });
      } catch (failure) {
        const error = toFileOperationError(failure);
        if (error.kind === "alreadyExists" || error.kind === "invalidName") {
          set({ renameError: error.message });
        } else {
          set({ renamingPath: null, renameError: null });
          notifyError(error.message);
        }
      }
    },

    trashSelected: async () => {
      const paths = directory.selectedPaths();
      if (paths.length === 0) return;
      if (shouldConfirmTrash()) {
        set({ pendingDeletion: { paths, mode: "trash" } });
        return;
      }
      await removeEntries("move to trash", paths, gateway.trashEntries);
    },

    requestPermanentDelete: () => {
      const paths = directory.selectedPaths();
      if (paths.length > 0) set({ pendingDeletion: { paths, mode: "permanent" } });
    },

    confirmDeletion: async () => {
      const pending = get().pendingDeletion;
      set({ pendingDeletion: null });
      if (!pending) return;
      if (pending.mode === "trash") {
        await removeEntries("move to trash", pending.paths, gateway.trashEntries);
      } else {
        await removeEntries("delete", pending.paths, gateway.deleteEntriesPermanently);
      }
    },

    cancelDeletion: () => set({ pendingDeletion: null }),

    openContextMenu: (request) => set({ contextMenu: request }),
    closeContextMenu: () => set({ contextMenu: null }),
  }));
}
