import {
  createDirectoryBrowsingStore,
  tauriDirectoryGateway,
} from "../directory-browsing";
import { createFileOperationsStore, tauriFileOperationsGateway } from "../file-operations";
import { createFileTransferStore, tauriFileTransferGateway } from "../file-transfer";
import { createNavigationStore, tauriPlacesGateway } from "../navigation";
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
    notify: (message, tone) => toastStore.getState().push(message, tone),
  });

  function connectBackendEvents() {
    return tauriFileTransferGateway.subscribeToTransfers(fileTransferStore.getState().handleEvent);
  }

  return {
    toastStore,
    directoryBrowsingStore,
    navigationStore,
    fileOperationsStore,
    fileTransferStore,
    connectBackendEvents,
  };
}
