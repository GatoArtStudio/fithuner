import { useEffect, useState } from "react";
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
  Breadcrumbs,
  NavigationControls,
  NavigationProvider,
  Sidebar,
  useNavigation,
  useNavigationShortcuts,
} from "../navigation";
import { ToastProvider } from "../shared/notifications/ToastContext";
import { ToastViewport } from "../shared/notifications/ToastViewport";
import { composeApplication } from "./composition-root";
import styles from "./App.module.css";

function Explorer() {
  const loadPlaces = useNavigation((state) => state.loadPlaces);
  const navigateTo = useNavigation((state) => state.navigateTo);
  const renamingPath = useFileOperations((state) => state.renamingPath);
  const openEntry = useFileOperations((state) => state.openEntry);
  const openContextMenu = useFileOperations((state) => state.openContextMenu);
  useNavigationShortcuts();
  useFileOperationShortcuts();

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
            renderNameEditor={(entry) =>
              entry.path === renamingPath ? (
                <InlineRenameInput initialName={entry.name} isDirectory={entry.kind === "directory"} />
              ) : null
            }
          />
        </div>
        <FolderStatusBar />
      </main>
      <EntryContextMenu />
      <PermanentDeleteDialog />
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
            <Explorer />
          </FileOperationsProvider>
        </NavigationProvider>
      </DirectoryBrowsingProvider>
    </ToastProvider>
  );
}
