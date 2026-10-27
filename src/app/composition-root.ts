import {
  createDirectoryBrowsingStore,
  tauriDirectoryGateway,
} from "../directory-browsing";
import { createFileClipboardStore, tauriFileClipboardGateway } from "../file-clipboard";
import { createFileOperationsStore, tauriFileOperationsGateway } from "../file-operations";
import { createFileTransferStore, isValidDropTarget, tauriFileTransferGateway } from "../file-transfer";
import { createNavigationStore, tauriPlacesGateway } from "../navigation";
import { createDragSessionStore } from "../shared/drag-and-drop/drag-session-store";
import { findDropTargetAt } from "../shared/drag-and-drop/drop-targets";
import { createToastStore } from "../shared/notifications/toast-store";

export function composeApplication() {
  const toastStore = createToastStore();
  const directoryBrowsingStore = createDirectoryBrowsingStore(tauriDirectoryGateway);
  const navigationStore = createNavigationStore({
    placesGateway: tauriPlacesGateway,
    openDirectory: directoryBrowsingStore.getState().openDirectory,
  });
  const fileOperationsStore = createFileOperationsStore({
    gateway: tauriFileOperationsGateway,
    directory: {
      currentDirectoryPath: () => directoryBrowsingStore.getState().listing?.path ?? null,
      selectedPaths: () => directoryBrowsingStore.getState().selectedPaths,
      refresh: () => directoryBrowsingStore.getState().refresh(),
      selectEntry: (path) => directoryBrowsingStore.getState().selectOnly(path),
    },
    notifyError: (message) => toastStore.getState().push(message, "error"),
  });

  const fileTransferStore = createFileTransferStore({
    gateway: tauriFileTransferGateway,
    refreshDirectory: () => directoryBrowsingStore.getState().refresh(),
    resolveDropTargetAt: findDropTargetAt,
    currentDirectoryPath: () => directoryBrowsingStore.getState().listing?.path ?? null,
    notify: (message, tone) => toastStore.getState().push(message, tone),
  });

  const fileClipboardStore = createFileClipboardStore({
    gateway: tauriFileClipboardGateway,
    directory: {
      selectedPaths: () => directoryBrowsingStore.getState().selectedPaths,
      currentDirectoryPath: () => directoryBrowsingStore.getState().listing?.path ?? null,
    },
    startTransfer: (request) => fileTransferStore.getState().startTransfer(request),
    notifyError: (message) => toastStore.getState().push(message, "error"),
  });

  const dragSessionStore = createDragSessionStore();
  const dragAndDrop = {
    store: dragSessionStore,
    canDrop: isValidDropTarget,
    onDrop: ({ paths, targetPath, isCopy }: { paths: string[]; targetPath: string; isCopy: boolean }) => {
      void fileTransferStore.getState().startTransfer({
        sources: paths,
        destinationDirectory: targetPath,
        mode: isCopy ? "copy" : "move",
      });
    },
  };

  async function connectBackendEvents() {
    const unsubscribes = await Promise.all([
      tauriFileTransferGateway.subscribeToTransfers(fileTransferStore.getState().handleEvent),
      tauriFileTransferGateway.subscribeToExternalDrags(fileTransferStore.getState().handleExternalDrag),
    ]);
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }

  return {
    toastStore,
    directoryBrowsingStore,
    navigationStore,
    fileOperationsStore,
    fileTransferStore,
    fileClipboardStore,
    dragAndDrop,
    connectBackendEvents,
  };
}
