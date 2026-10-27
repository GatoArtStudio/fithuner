import { useEffect, useMemo, useState } from "react";
import {
  PreviewPanel,
  PreviewProvider,
  QuickLook,
  usePreview,
  PreviewToggleButton,
  usePreviewLayout,
  usePreviewShortcuts,
  type PreviewTarget,
} from "../file-preview";
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
  useDirectoryBrowsing,
  useSelectedEntry,
  useSelectionCount,
  useVisibleEntries,
  type FileEntry,
} from "../directory-browsing";
import {
  EntryContextMenu,
  FileOperationsProvider,
  InlineRenameInput,
  DeleteConfirmationDialog,
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
import {
  SettingsButton,
  SettingsProvider,
  SettingsView,
  useApplyTheme,
  useSettings,
  useSettingsShortcut,
} from "../settings";
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
  const isDialogOpen = useFileOperations((state) => state.pendingDeletion !== null);
  const renderClipboardMenuItems = useClipboardMenuItems();
  const loadSettings = useSettings((state) => state.load);
  const isSettingsOpen = useSettings((state) => state.isOpen);
  useApplyTheme();
  useSettingsShortcut();
  const selectedEntry = useSelectedEntry();
  const selectionCount = useSelectionCount();
  const previewLayout = usePreviewLayout();
  const previewTarget = useMemo<PreviewTarget | null>(
    () =>
      selectedEntry && {
        path: selectedEntry.path,
        name: selectedEntry.name,
        kind: selectedEntry.kind,
        sizeInBytes: selectedEntry.sizeInBytes,
        modifiedAtMillis: selectedEntry.modifiedAtMillis,
      },
    [selectedEntry],
  );
  const visibleEntries = useVisibleEntries();
  const selectOnly = useDirectoryBrowsing((state) => state.selectOnly);
  const openQuickLook = usePreview((state) => state.openQuickLook);
  usePreviewShortcuts(isSettingsOpen);
  useNavigationShortcuts(isSettingsOpen);
  useFileOperationShortcuts(isSettingsOpen);
  useClipboardShortcuts(isDialogOpen || renamingPath !== null || isSettingsOpen);

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
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    void loadPlaces();
    void navigateTo(undefined);
  }, [loadPlaces, navigateTo]);

  function stepQuickLook(delta: 1 | -1) {
    const currentIndex = visibleEntries.findIndex((entry) => entry.path === selectedEntry?.path);
    const next = visibleEntries[currentIndex + delta];
    if (next) selectOnly(next.path);
  }

  function handleOpenEntry(entry: FileEntry) {
    if (entry.kind === "directory") void navigateTo(entry.path);
    else void openEntry(entry.path);
  }

  return (
    <>
      <div className={styles.shell} hidden={isSettingsOpen}>
        <Sidebar footer={<SettingsButton />} />
        <main className={styles.main}>
          <header className={styles.toolbar}>
            <NavigationControls />
            <Breadcrumbs />
            <ShowHiddenToggle />
            <PreviewToggleButton />
          </header>
          <div
            className={styles.content}
            data-panel={previewLayout.isPanelVisible ? previewLayout.position : "none"}
            style={{ "--panel-size": `${previewLayout.sizePx}px` } as React.CSSProperties}
          >
            <div className={styles.listArea}>
            <DirectoryList
              onOpenEntry={handleOpenEntry}
              onContextMenu={(entry, position) =>
                openContextMenu({
                  target: entry && { path: entry.path, kind: entry.kind },
                  ...position,
                })
              }
              isEntryDimmed={(entry) => cutPaths.includes(entry.path)}
            onQuickLook={previewLayout.isQuickLookEnabled ? () => openQuickLook() : undefined}
              renderNameEditor={(entry) =>
                entry.path === renamingPath ? (
                  <InlineRenameInput initialName={entry.name} isDirectory={entry.kind === "directory"} />
                ) : null
              }
            />
            </div>
            <PreviewPanel
              target={previewTarget}
              selectionCount={selectionCount}
              onOpenExternally={(path) => void openEntry(path)}
            />
          </div>
          <FolderStatusBar />
        </main>
      </div>
      {isSettingsOpen && <SettingsView />}
      <EntryContextMenu renderExtraItems={renderClipboardMenuItems} />
      <DeleteConfirmationDialog />
      <ConflictDialog />
      <QuickLook
        target={previewTarget}
        onStep={stepQuickLook}
        onOpenExternally={(path) => void openEntry(path)}
      />
      <TransferPanel />
      <ExternalDropOverlay />
      <DragPreview />
      <ToastViewport />
    </>
  );
}

export function App() {
  const [application] = useState(composeApplication);

  return (
    <ToastProvider store={application.toastStore}>
      <SettingsProvider store={application.settingsStore}>
      <PreviewProvider store={application.previewStore} gateway={application.previewGateway}>
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
      </PreviewProvider>
      </SettingsProvider>
    </ToastProvider>
  );
}
