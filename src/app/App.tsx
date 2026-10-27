import { useEffect, useState } from "react";
import {
  FileClipboardProvider,
  useClipboardMenuItems,
  useClipboardShortcuts,
  useFileClipboard,
} from "../file-clipboard";
import {
  DirectoryBrowsingProvider,
  DirectoryList,
  FolderStatusBar,
  ShowHiddenToggle,
  type FileEntry,
} from "../directory-browsing";
import {
  EntryContextMenu,
  FileOperationsProvider,
  InlineRenameInput,
  PermanentDeleteDialog,
  useFileOperationShortcuts,
  useFileOperations,
} from "../file-operations";
import {
  ConflictDialog,
  ExternalDropOverlay,
  FileTransferProvider,
  TransferPanel,
} from "../file-transfer";
import {
  Breadcrumbs,
  NavigationControls,
  NavigationProvider,
  Sidebar,
  useNavigation,
  useNavigationShortcuts,
} from "../navigation";
import { DragAndDropProvider } from "../shared/drag-and-drop/DragAndDropContext";
import { DragPreview } from "../shared/drag-and-drop/DragPreview";
import { ToastProvider } from "../shared/notifications/ToastContext";
import { ToastViewport } from "../shared/notifications/ToastViewport";
import { composeApplication } from "./composition-root";
import styles from "./App.module.css";

interface ExplorerProps {
  connectBackendEvents: () => Promise<() => void>;
}

function Explorer({ connectBackendEvents }: ExplorerProps) {
  const loadPlaces = useNavigation((state) => state.loadPlaces);
  const navigateTo = useNavigation((state) => state.navigateTo);
  const renamingPath = useFileOperations((state) => state.renamingPath);
  const openEntry = useFileOperations((state) => state.openEntry);
  const openContextMenu = useFileOperations((state) => state.openContextMenu);
  const cutPaths = useFileClipboard((state) => state.cutPaths);
  const isDialogOpen = useFileOperations((state) => state.pendingPermanentDeletePaths !== null);
  const renderClipboardMenuItems = useClipboardMenuItems();
  useNavigationShortcuts();
  useFileOperationShortcuts();
  useClipboardShortcuts(isDialogOpen || renamingPath !== null);

  useEffect(() => {
    let isDisposed = false;
    let disconnect: (() => void) | undefined;
    void connectBackendEvents().then((unsubscribe) => {
      if (isDisposed) unsubscribe();
      else disconnect = unsubscribe;
    });
    return () => {
      isDisposed = true;
      disconnect?.();
    };
  }, [connectBackendEvents]);

  useEffect(() => {
    void loadPlaces();
    void navigateTo(undefined);
  }, [loadPlaces, navigateTo]);

  function handleOpenEntry(entry: FileEntry) {
    if (entry.kind === "directory") void navigateTo(entry.path);
    else void openEntry(entry.path);
  }

  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.main}>
        <header className={styles.toolbar}>
          <NavigationControls />
          <Breadcrumbs />
          <ShowHiddenToggle />
        </header>
        <div className={styles.content}>
          <DirectoryList
            onOpenEntry={handleOpenEntry}
            onContextMenu={(entry, position) =>
              openContextMenu({
                target: entry && { path: entry.path, kind: entry.kind },
                ...position,
              })
            }
            isEntryDimmed={(entry) => cutPaths.includes(entry.path)}
            renderNameEditor={(entry) =>
              entry.path === renamingPath ? (
                <InlineRenameInput initialName={entry.name} isDirectory={entry.kind === "directory"} />
              ) : null
            }
          />
        </div>
        <FolderStatusBar />
      </main>
      <EntryContextMenu renderExtraItems={renderClipboardMenuItems} />
      <PermanentDeleteDialog />
      <ConflictDialog />
      <TransferPanel />
      <ExternalDropOverlay />
      <DragPreview />
      <ToastViewport />
    </div>
  );
}

export function App() {
  const [application] = useState(composeApplication);

  return (
    <ToastProvider store={application.toastStore}>
      <DirectoryBrowsingProvider store={application.directoryBrowsingStore}>
        <NavigationProvider store={application.navigationStore}>
          <FileOperationsProvider store={application.fileOperationsStore}>
            <FileTransferProvider store={application.fileTransferStore}>
              <FileClipboardProvider store={application.fileClipboardStore}>
                <DragAndDropProvider {...application.dragAndDrop}>
                  <Explorer connectBackendEvents={application.connectBackendEvents} />
                </DragAndDropProvider>
              </FileClipboardProvider>
            </FileTransferProvider>
          </FileOperationsProvider>
        </NavigationProvider>
      </DirectoryBrowsingProvider>
    </ToastProvider>
  );
}
