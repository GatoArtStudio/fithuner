import { useEffect, useState } from "react";
import {
  DirectoryBrowsingProvider,
  DirectoryList,
  FolderStatusBar,
  ShowHiddenToggle,
} from "../directory-browsing";
import {
  Breadcrumbs,
  NavigationControls,
  NavigationProvider,
  Sidebar,
  useNavigation,
  useNavigationShortcuts,
} from "../navigation";
import { composeApplication } from "./composition-root";
import styles from "./App.module.css";

function Explorer() {
  const loadPlaces = useNavigation((state) => state.loadPlaces);
  const navigateTo = useNavigation((state) => state.navigateTo);
  useNavigationShortcuts();

  useEffect(() => {
    void loadPlaces();
    void navigateTo(undefined);
  }, [loadPlaces, navigateTo]);

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
          <DirectoryList onOpenDirectory={(path) => void navigateTo(path)} />
        </div>
        <FolderStatusBar />
      </main>
    </div>
  );
}

export function App() {
  const [application] = useState(composeApplication);

  return (
    <DirectoryBrowsingProvider store={application.directoryBrowsingStore}>
      <NavigationProvider store={application.navigationStore}>
        <Explorer />
      </NavigationProvider>
    </DirectoryBrowsingProvider>
  );
}
