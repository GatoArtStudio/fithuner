import {
  createDirectoryBrowsingStore,
  tauriDirectoryGateway,
} from "../directory-browsing";
import { createFileOperationsStore, tauriFileOperationsGateway } from "../file-operations";
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

  return { toastStore, directoryBrowsingStore, navigationStore, fileOperationsStore };
}
