import {
  createDirectoryBrowsingStore,
  tauriDirectoryGateway,
} from "../directory-browsing";
import { bindSearch } from "./bind-search";
import { buildPaletteItems } from "./palette-sources";
import { bindSettings } from "./bind-settings";
import { createUpdatesStore, tauriUpdatesGateway } from "../app-updates";
import { createCommandPaletteStore } from "../command-palette";
import { createSearchStore, tauriSearchGateway } from "../folder-search";
import { createFileClipboardStore, tauriFileClipboardGateway } from "../file-clipboard";
import { createFileOperationsStore, tauriFileOperationsGateway } from "../file-operations";
import { createFileTransferStore, isValidDropTarget, tauriFileTransferGateway } from "../file-transfer";
import { createNavigationStore, tauriPlacesGateway } from "../navigation";
import { createDragSessionStore } from "../shared/drag-and-drop/drag-session-store";
import { findDropTargetAt } from "../shared/drag-and-drop/drop-targets";
import { createPreviewStore, tauriPreviewGateway } from "../file-preview";
import { createSettingsStore, tauriSettingsGateway } from "../settings";
import { createToastStore } from "../shared/notifications/toast-store";

export function composeApplication() {
  const toastStore = createToastStore();
  const settingsStore = createSettingsStore({
    gateway: tauriSettingsGateway,
    notifyError: (message) => toastStore.getState().push(message, "error"),
  });
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
    shouldConfirmTrash: () => settingsStore.getState().settings.browsing.confirmBeforeTrash,
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

  bindSettings({ settingsStore, directoryBrowsingStore });

  async function connectBackendEvents() {
    const unsubscribes = await Promise.all([
      tauriFileTransferGateway.subscribeToTransfers(fileTransferStore.getState().handleEvent),
      tauriFileTransferGateway.subscribeToExternalDrags(fileTransferStore.getState().handleExternalDrag),
      tauriUpdatesGateway.subscribeToDownload(updatesStore.getState().handleDownloadEvent),
      tauriSearchGateway.subscribe(searchStore.getState().handleEvent),
    ]);
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }

  const previewStore = createPreviewStore();
  const searchStore = createSearchStore({
    gateway: tauriSearchGateway,
    currentDirectoryPath: () => directoryBrowsingStore.getState().listing?.path ?? null,
  });
  bindSearch({ searchStore, directoryBrowsingStore });
  const updatesStore = createUpdatesStore({
    gateway: tauriUpdatesGateway,
    shouldCheckOnStartup: () => settingsStore.getState().settings.updates.checkOnStartup,
    shouldDownloadAutomatically: () => settingsStore.getState().settings.updates.autoDownload,
    notifyReady: (version) =>
      toastStore
        .getState()
        .push(`Version ${version} is ready to install. Open Settings > Updates to restart.`, "info"),
  });

  const paletteStores = {
    directoryBrowsingStore,
    navigationStore,
    fileOperationsStore,
    fileClipboardStore,
    settingsStore,
    previewStore,
    updatesStore,
    searchStore,
  };
  const commandPaletteStore = createCommandPaletteStore({
    getItems: (query) => buildPaletteItems(paletteStores, query),
  });

  return {
    toastStore,
    previewStore,
    updatesStore,
    searchStore,
    commandPaletteStore,
    previewGateway: tauriPreviewGateway,
    settingsStore,
    directoryBrowsingStore,
    navigationStore,
    fileOperationsStore,
    fileTransferStore,
    fileClipboardStore,
    dragAndDrop,
    connectBackendEvents,
  };
}
