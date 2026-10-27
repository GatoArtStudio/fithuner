import { useEffect, useMemo, useRef, useState } from "react";
import { UpdateBadge, UpdatesProvider, UpdatesSection, useUpdates } from "../app-updates";
import {
  CommandPalette,
  CommandPaletteProvider,
  useCommandPaletteShortcuts,
} from "../command-palette";
import {
  SearchBar,
  SearchResults,
  SearchToggleButton,
  useSearch,
  useSearchShortcuts,
  useSelectedSearchResult,
  type SearchMatch,
  type SearchResultsHandle,
} from "../folder-search";
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
  fileNameOf,
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
  PlacesProvider,
  Sidebar,
  useNavigation,
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
import { DragAndDropProvider } from "../shared/drag-and-drop/DragAndDropContext";
import { DragPreview } from "../shared/drag-and-drop/DragPreview";
import { ToastProvider } from "../shared/notifications/ToastContext";
import { ToastViewport } from "../shared/notifications/ToastViewport";
import { ActiveSession } from "./ActiveSession";
import { composeApplication } from "./composition-root";
import styles from "./App.module.css";

interface ExplorerProps {
  connectBackendEvents: () => Promise<() => void>;
}

function Explorer({ connectBackendEvents }: ExplorerProps) {
  const loadPlaces = usePlaces((state) => state.load);
  const navigateTo = useNavigation((state) => state.navigateTo);
  const renamingPath = useFileOperations((state) => state.renamingPath);
  const openEntry = useFileOperations((state) => state.openEntry);
  const openContextMenu = useFileOperations((state) => state.openContextMenu);
  const cutPaths = useFileClipboard((state) => state.cutPaths);
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
  const closeSearch = useSearch((state) => state.close);
  const moveSearchSelection = useSearch((state) => state.moveSelection);
  const selectedResult = useSelectedSearchResult();
  const resultsRef = useRef<SearchResultsHandle>(null);
  const currentFolderPath = useDirectoryBrowsing((state) => state.listing?.path ?? null);
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
  const openQuickLook = usePreview((state) => state.openQuickLook);
  usePreviewShortcuts(isSettingsOpen);
  useSearchShortcuts(isSettingsOpen);
  useCommandPaletteShortcuts(isSettingsOpen);
  useNavigationShortcuts(isSettingsOpen || isSearchOpen);
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
    void loadSettings().then(runStartupCheck);
  }, [loadSettings, runStartupCheck]);

  useEffect(() => {
    void loadPlaces();
  }, [loadPlaces]);

  function parentFolderOf(match: SearchMatch): string {
    return match.path.slice(0, match.path.length - match.name.length).replace(/[\\/]$/, "") || "/";
  }

  function handleOpenMatch(match: SearchMatch) {
    if (match.kind === "directory") {
      closeSearch();
      void navigateTo(match.path);
    } else {
      void openEntry(match.path);
    }
  }

  function handleShowInFolder(match: SearchMatch) {
    closeSearch();
    void navigateTo(parentFolderOf(match)).then(() => selectOnly(match.path));
  }

  function stepQuickLook(delta: 1 | -1) {
    if (isSearchOpen) {
      moveSearchSelection(delta);
      return;
    }
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
        <Sidebar footer={<SettingsButton adornment={<UpdateBadge />} />} />
        <main className={styles.main}>
          <header className={styles.toolbar}>
            <NavigationControls />
            <Breadcrumbs />
            <ShowHiddenToggle />
            <SearchToggleButton />
            <PreviewToggleButton />
          </header>
          {isSearchOpen && (
            <SearchBar
              folderName={fileNameOf(currentFolderPath ?? "/")}
              onFocusResults={() => resultsRef.current?.focus()}
              onOpenSelected={() => selectedResult && handleOpenMatch(selectedResult)}
            />
          )}
          <div
            className={styles.content}
            data-panel={previewLayout.isPanelVisible ? previewLayout.position : "none"}
            style={{ "--panel-size": `${previewLayout.sizePx}px` } as React.CSSProperties}
          >
            <div className={styles.listArea}>
              {isSearchOpen ? (
                <SearchResults
                  ref={resultsRef}
                  onOpenMatch={handleOpenMatch}
                  onShowInFolder={handleShowInFolder}
                  onQuickLook={previewLayout.isQuickLookEnabled ? () => openQuickLook() : undefined}
                />
              ) : (
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
              )}
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
      <ActiveSession workspaceStore={application.workspaceStore}>
        <PlacesProvider store={application.placesStore}>
          <FileOperationsProvider store={application.fileOperationsStore}>
            <FileTransferProvider store={application.fileTransferStore}>
              <FileClipboardProvider store={application.fileClipboardStore}>
                <DragAndDropProvider {...application.dragAndDrop}>
                  <Explorer connectBackendEvents={application.connectBackendEvents} />
                </DragAndDropProvider>
              </FileClipboardProvider>
            </FileTransferProvider>
          </FileOperationsProvider>
        </PlacesProvider>
      </ActiveSession>
      </PreviewProvider>
      </UpdatesProvider>
      </CommandPaletteProvider>
      </SettingsProvider>
    </ToastProvider>
  );
}
