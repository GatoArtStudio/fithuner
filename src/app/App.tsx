import { useEffect, useMemo, useState } from "react";
import { UpdateBadge, UpdatesProvider, UpdatesSection, useUpdates } from "../app-updates";
import {
  CommandPalette,
  CommandPaletteProvider,
  useCommandPaletteShortcuts,
} from "../command-palette";
import {
  useSearch,
  useSearchShortcuts,
  useSelectedSearchResult,
} from "../folder-search";
import {
  PreviewPanel,
  PreviewProvider,
  QuickLook,
  usePreviewLayout,
  usePreviewShortcuts,
  type PreviewTarget,
} from "../file-preview";
import {
  FileClipboardProvider,
  useClipboardMenuItems,
  useClipboardShortcuts,
} from "../file-clipboard";
import {
  useDirectoryBrowsing,
  useSelectedEntry,
  useSelectionCount,
  useVisibleEntries,
} from "../directory-browsing";
import {
  EntryContextMenu,
  FileOperationsProvider,
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
  PlacesProvider,
  Sidebar,
  usePlaces,
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
import { WorkspaceProvider, useWorkspaceShortcuts } from "../workspace";
import { DragAndDropProvider } from "../shared/drag-and-drop/DragAndDropContext";
import { DragPreview } from "../shared/drag-and-drop/DragPreview";
import { ToastProvider } from "../shared/notifications/ToastContext";
import { ToastViewport } from "../shared/notifications/ToastViewport";
import { ActiveSession } from "./ActiveSession";
import { WorkspaceView } from "./WorkspaceView";
import { composeApplication } from "./composition-root";
import styles from "./App.module.css";

interface ExplorerProps {
  connectBackendEvents: () => Promise<() => void>;
  startWorkspacePersistence: () => () => void;
}

function Explorer({ connectBackendEvents, startWorkspacePersistence }: ExplorerProps) {
  const loadPlaces = usePlaces((state) => state.load);
  const openEntry = useFileOperations((state) => state.openEntry);
  const renamingPath = useFileOperations((state) => state.renamingPath);
  const isDialogOpen = useFileOperations((state) => state.pendingDeletion !== null);
  const renderClipboardMenuItems = useClipboardMenuItems();
  const loadSettings = useSettings((state) => state.load);
  const runStartupCheck = useUpdates((state) => state.runStartupCheck);
  const isSettingsOpen = useSettings((state) => state.isOpen);
  useApplyTheme();
  useSettingsShortcut();
  const selectedEntry = useSelectedEntry();
  const directorySelectionCount = useSelectionCount();
  const isSearchOpen = useSearch((state) => state.isOpen);
  const moveSearchSelection = useSearch((state) => state.moveSelection);
  const selectedResult = useSelectedSearchResult();
  const previewSource = isSearchOpen ? selectedResult : selectedEntry;
  const selectionCount = isSearchOpen ? (selectedResult ? 1 : 0) : directorySelectionCount;
  const previewLayout = usePreviewLayout();
  const previewTarget = useMemo<PreviewTarget | null>(
    () =>
      previewSource && {
        path: previewSource.path,
        name: previewSource.name,
        kind: previewSource.kind,
        sizeInBytes: previewSource.sizeInBytes,
        modifiedAtMillis: previewSource.modifiedAtMillis,
      },
    [previewSource],
  );
  const visibleEntries = useVisibleEntries();
  const selectOnly = useDirectoryBrowsing((state) => state.selectOnly);
  usePreviewShortcuts(isSettingsOpen);
  useSearchShortcuts(isSettingsOpen);
  useCommandPaletteShortcuts(isSettingsOpen);
  useNavigationShortcuts(isSettingsOpen || isSearchOpen);
  useWorkspaceShortcuts(isSettingsOpen);
  useFileOperationShortcuts(isSettingsOpen || isSearchOpen);
  useClipboardShortcuts(isDialogOpen || renamingPath !== null || isSettingsOpen || isSearchOpen);

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
    let isDisposed = false;
    let stopPersistence: (() => void) | undefined;
    void loadSettings().then(() => {
      if (isDisposed) return;
      stopPersistence = startWorkspacePersistence();
      return runStartupCheck();
    });
    return () => {
      isDisposed = true;
      stopPersistence?.();
    };
  }, [loadSettings, runStartupCheck, startWorkspacePersistence]);

  useEffect(() => {
    void loadPlaces();
  }, [loadPlaces]);

  function stepQuickLook(delta: 1 | -1) {
    if (isSearchOpen) {
      moveSearchSelection(delta);
      return;
    }
    const currentIndex = visibleEntries.findIndex((entry) => entry.path === selectedEntry?.path);
    const next = visibleEntries[currentIndex + delta];
    if (next) selectOnly(next.path);
  }

  return (
    <>
      <div className={styles.shell} hidden={isSettingsOpen}>
        <Sidebar footer={<SettingsButton adornment={<UpdateBadge />} />} />
        <main className={styles.main}>
          <div
            className={styles.content}
            data-panel={previewLayout.isPanelVisible ? previewLayout.position : "none"}
            style={{ "--panel-size": `${previewLayout.sizePx}px` } as React.CSSProperties}
          >
            <div className={styles.workspaceArea}>
              <WorkspaceView />
            </div>
            <PreviewPanel
              target={previewTarget}
              selectionCount={selectionCount}
              onOpenExternally={(path) => void openEntry(path)}
            />
          </div>
        </main>
      </div>
      {isSettingsOpen && (
        <SettingsView
          extraSections={[{ id: "updates", label: "Updates", content: <UpdatesSection /> }]}
        />
      )}
      <EntryContextMenu renderExtraItems={renderClipboardMenuItems} />
      <DeleteConfirmationDialog />
      <ConflictDialog />
      <CommandPalette />
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
      <CommandPaletteProvider store={application.commandPaletteStore}>
      <UpdatesProvider store={application.updatesStore}>
      <PreviewProvider store={application.previewStore} gateway={application.previewGateway}>
      <WorkspaceProvider store={application.workspaceStore}>
      <ActiveSession workspaceStore={application.workspaceStore}>
        <PlacesProvider store={application.placesStore}>
          <FileOperationsProvider store={application.fileOperationsStore}>
            <FileTransferProvider store={application.fileTransferStore}>
              <FileClipboardProvider store={application.fileClipboardStore}>
                <DragAndDropProvider {...application.dragAndDrop}>
                  <Explorer
                    connectBackendEvents={application.connectBackendEvents}
                    startWorkspacePersistence={application.startWorkspacePersistence}
                  />
                </DragAndDropProvider>
              </FileClipboardProvider>
            </FileTransferProvider>
          </FileOperationsProvider>
        </PlacesProvider>
      </ActiveSession>
      </WorkspaceProvider>
      </PreviewProvider>
      </UpdatesProvider>
      </CommandPaletteProvider>
      </SettingsProvider>
    </ToastProvider>
  );
}
