import { useRef } from "react";
import {
  DirectoryList,
  FolderStatusBar,
  ShowHiddenToggle,
  useDirectoryBrowsing,
  type FileEntry,
} from "../directory-browsing";
import { useFileClipboard } from "../file-clipboard";
import { InlineRenameInput, fileNameOf, useFileOperations } from "../file-operations";
import { PreviewToggleButton, usePreview, usePreviewLayout } from "../file-preview";
import {
  SearchBar,
  SearchResults,
  SearchToggleButton,
  useSearch,
  useSelectedSearchResult,
  type SearchMatch,
  type SearchResultsHandle,
} from "../folder-search";
import { Breadcrumbs, NavigationControls, useHistoryMouseButtons, useNavigation } from "../navigation";
import { SplitToggleButton, TabBar, useWorkspace } from "../workspace";
import type { BrowsingSession } from "./browsing-session";
import { SessionProviders } from "./SessionProviders";
import { TabTitle } from "./TabTitle";
import styles from "./PaneView.module.css";

interface PaneContentProps {
  paneId: string;
  isActive: boolean;
}

function PaneContent({ paneId, isActive }: PaneContentProps) {
  const activatePane = useWorkspace((state) => state.activatePane);
  const navigateTo = useNavigation((state) => state.navigateTo);
  const openEntry = useFileOperations((state) => state.openEntry);
  const openContextMenu = useFileOperations((state) => state.openContextMenu);
  const renamingPath = useFileOperations((state) => state.renamingPath);
  const cutPaths = useFileClipboard((state) => state.cutPaths);
  const isSearchOpen = useSearch((state) => state.isOpen);
  const closeSearch = useSearch((state) => state.close);
  const selectedResult = useSelectedSearchResult();
  const currentFolderPath = useDirectoryBrowsing((state) => state.listing?.path ?? null);
  const selectOnly = useDirectoryBrowsing((state) => state.selectOnly);
  const openQuickLook = usePreview((state) => state.openQuickLook);
  const { isQuickLookEnabled } = usePreviewLayout();
  const resultsRef = useRef<SearchResultsHandle>(null);
  const historyMouseButtons = useHistoryMouseButtons(isSearchOpen);

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

  function handleOpenEntry(entry: FileEntry) {
    if (entry.kind === "directory") void navigateTo(entry.path);
    else void openEntry(entry.path);
  }

  return (
    <section
      className={styles.pane}
      aria-label="Folder pane"
      data-active={isActive}
      onMouseDownCapture={() => activatePane(paneId)}
      onFocusCapture={() => activatePane(paneId)}
      {...historyMouseButtons}
    >
      <TabBar
        paneId={paneId}
        isActivePane={isActive}
        renderTitle={(tab) => <TabTitle sessionId={tab.sessionId} />}
      />
      <header className={styles.toolbar}>
        <NavigationControls />
        <Breadcrumbs />
        <ShowHiddenToggle />
        <SearchToggleButton />
        <PreviewToggleButton />
        <SplitToggleButton />
      </header>
      {isSearchOpen && (
        <SearchBar
          folderName={fileNameOf(currentFolderPath ?? "/")}
          onFocusResults={() => resultsRef.current?.focus()}
          onOpenSelected={() => selectedResult && handleOpenMatch(selectedResult)}
        />
      )}
      <div className={styles.listArea} data-drop-path={isSearchOpen ? undefined : (currentFolderPath ?? undefined)}>
        {isSearchOpen ? (
          <SearchResults
            ref={resultsRef}
            onOpenMatch={handleOpenMatch}
            onShowInFolder={handleShowInFolder}
            onQuickLook={isQuickLookEnabled ? () => openQuickLook() : undefined}
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
            onQuickLook={isQuickLookEnabled ? () => openQuickLook() : undefined}
            renderNameEditor={(entry) =>
              isActive && entry.path === renamingPath ? (
                <InlineRenameInput initialName={entry.name} isDirectory={entry.kind === "directory"} />
              ) : null
            }
          />
        )}
      </div>
      <FolderStatusBar />
    </section>
  );
}

interface PaneViewProps {
  paneId: string;
}

export function PaneView({ paneId }: PaneViewProps) {
  const isActive = useWorkspace((state) => state.workspace.activePaneId === paneId);
  const session = useWorkspace<BrowsingSession, BrowsingSession | undefined>((state) => {
    const pane = state.workspace.panes.find((candidate) => candidate.id === paneId);
    const tab = pane?.tabs.find((candidate) => candidate.id === pane.activeTabId);
    return tab && state.sessions[tab.sessionId];
  });

  if (!session) return null;
  return (
    <SessionProviders key={session.id} session={session}>
      <PaneContent paneId={paneId} isActive={isActive} />
    </SessionProviders>
  );
}
