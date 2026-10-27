import { tauriDirectoryGateway } from "../directory-browsing";
import { undoActionFromOperation, undoActionFromTransfer } from "./undo-actions";
import { bindFolderWatching } from "./bind-folder-watching";
import { startWorkspacePersistence } from "./bind-workspace-persistence";
import { buildPaletteItems } from "./palette-sources";
import { createBrowsingSessionFactory, type BrowsingSession } from "./browsing-session";
import { createUpdatesStore, tauriUpdatesGateway } from "../app-updates";
import { createCommandPaletteStore } from "../command-palette";
import { tauriSearchGateway } from "../folder-search";
import { tauriFolderWatchGateway } from "../folder-watching";
import { createFileClipboardStore, tauriFileClipboardGateway } from "../file-clipboard";
import { createFileOperationsStore, tauriFileOperationsGateway } from "../file-operations";
import { createFileTransferStore, isMoveWithinSameFolder, isValidDropTarget, tauriFileTransferGateway } from "../file-transfer";
import { createPlacesStore, tauriPlacesGateway } from "../navigation";
import { createDragSessionStore } from "../shared/drag-and-drop/drag-session-store";
import { findDropTargetAt } from "../shared/drag-and-drop/drop-targets";
import { createPreviewStore, tauriPreviewGateway } from "../file-preview";
import { createSettingsStore, tauriSettingsGateway } from "../settings";
import { createUndoStore } from "../undo-history";
import { createToastStore } from "../shared/notifications/toast-store";
import {
  createLocalStorageWorkspaceLayoutGateway,
  createWorkspaceStore,
  selectActiveSession,
} from "../workspace";

export function composeApplication() {
  const toastStore = createToastStore();
  const settingsStore = createSettingsStore({
    gateway: tauriSettingsGateway,
    notifyError: (message) => toastStore.getState().push(message, "error"),
  });
  const placesStore = createPlacesStore({ placesGateway: tauriPlacesGateway });
  const createBrowsingSession = createBrowsingSessionFactory({
    settingsStore,
    directoryGateway: tauriDirectoryGateway,
    searchGateway: tauriSearchGateway,
  });
  const workspaceStore = createWorkspaceStore<BrowsingSession>({
    createSession: createBrowsingSession,
    disposeSession: (session) => session.dispose(),
    currentPathOf: (session) => session.directoryBrowsingStore.getState().listing?.path,
  });
  const folderWatching = bindFolderWatching({
    workspaceStore,
    settingsStore,
    gateway: tauriFolderWatchGateway,
  });
  const activeSession = () => selectActiveSession(workspaceStore.getState());
  const activeDirectory = () => activeSession().directoryBrowsingStore.getState();
  const refreshAllSessions = async () => {
    const sessions = Object.values(workspaceStore.getState().sessions);
    await Promise.all(sessions.map((session) => session.directoryBrowsingStore.getState().refresh()));
  };
  const undoStore = createUndoStore({
    gateway: tauriFileOperationsGateway,
    afterChange: async () => {
      const sessions = Object.values(workspaceStore.getState().sessions);
      await Promise.all(sessions.map((session) => session.directoryBrowsingStore.getState().reload()));
    },
    notify: (message, tone) => toastStore.getState().push(message, tone),
  });
  const fileOperationsStore = createFileOperationsStore({
    gateway: tauriFileOperationsGateway,
    onCompleted: (event) => undoStore.getState().record(undoActionFromOperation(event)),
    directory: {
      currentDirectoryPath: () => activeDirectory().listing?.path ?? null,
      selectedPaths: () => activeDirectory().selectedPaths,
      refresh: refreshAllSessions,
      selectEntry: (path) => activeDirectory().selectOnly(path),
    },
    notifyError: (message) => toastStore.getState().push(message, "error"),
    shouldConfirmTrash: () => settingsStore.getState().settings.browsing.confirmBeforeTrash,
  });

  const fileTransferStore = createFileTransferStore({
    gateway: tauriFileTransferGateway,
    refreshDirectory: refreshAllSessions,
    resolveDropTargetAt: findDropTargetAt,
    currentDirectoryPath: () => activeDirectory().listing?.path ?? null,
    notify: (message, tone) => toastStore.getState().push(message, tone),
    onTransferFinished: (finished) => {
      const action = undoActionFromTransfer(finished);
      if (action) undoStore.getState().record(action);
    },
  });

  const fileClipboardStore = createFileClipboardStore({
    gateway: tauriFileClipboardGateway,
    directory: {
      selectedPaths: () => activeDirectory().selectedPaths,
      currentDirectoryPath: () => activeDirectory().listing?.path ?? null,
    },
    startTransfer: (request) => fileTransferStore.getState().startTransfer(request),
    notifyError: (message) => toastStore.getState().push(message, "error"),
  });

  const dragSessionStore = createDragSessionStore();
  const dragAndDrop = {
    store: dragSessionStore,
    canDrop: isValidDropTarget,
    onDrop: ({ paths, targetPath, isCopy }: { paths: string[]; targetPath: string; isCopy: boolean }) => {
      if (!isCopy && isMoveWithinSameFolder(paths, targetPath)) return;
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
      tauriUpdatesGateway.subscribeToDownload(updatesStore.getState().handleDownloadEvent),
      tauriFolderWatchGateway.subscribe(folderWatching.handleFolderChanged),
      tauriSearchGateway.subscribe((event) => {
        for (const session of Object.values(workspaceStore.getState().sessions)) {
          session.searchStore.getState().handleEvent(event);
        }
      }),
    ]);
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }

  const previewStore = createPreviewStore();
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
    activeSession,
    placesStore,
    fileOperationsStore,
    fileClipboardStore,
    settingsStore,
    previewStore,
    updatesStore,
    workspaceStore,
    fileTransferStore,
    undoStore,
  };
  const commandPaletteStore = createCommandPaletteStore({
    getItems: (query) => buildPaletteItems(paletteStores, query),
  });

  return {
    toastStore,
    previewStore,
    updatesStore,
    workspaceStore,
    undoStore,
    commandPaletteStore,
    previewGateway: tauriPreviewGateway,
    settingsStore,
    placesStore,
    fileOperationsStore,
    fileTransferStore,
    fileClipboardStore,
    dragAndDrop,
    connectBackendEvents,
    startWorkspacePersistence: () =>
      startWorkspacePersistence({
        workspaceStore,
        settingsStore,
        gateway: createLocalStorageWorkspaceLayoutGateway(),
      }),
  };
}
