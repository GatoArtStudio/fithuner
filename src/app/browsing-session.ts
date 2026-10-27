import { createDirectoryBrowsingStore, type DirectoryBrowsingStore, type DirectoryGateway } from "../directory-browsing";
import { createSearchStore, type SearchGateway, type SearchStore } from "../folder-search";
import { createNavigationStore, type NavigationStore } from "../navigation";
import type { SettingsStore } from "../settings";
import { bindSearch } from "./bind-search";
import { bindSettings } from "./bind-settings";

export interface BrowsingSession {
  id: string;
  directoryBrowsingStore: DirectoryBrowsingStore;
  navigationStore: NavigationStore;
  searchStore: SearchStore;
  dispose: () => void;
}

export interface BrowsingSessionDependencies {
  settingsStore: SettingsStore;
  directoryGateway: DirectoryGateway;
  searchGateway: SearchGateway;
}

export function createBrowsingSessionFactory({
  settingsStore,
  directoryGateway,
  searchGateway,
}: BrowsingSessionDependencies) {
  let sessionCount = 0;

  return function createBrowsingSession(startPath?: string): BrowsingSession {
    const directoryBrowsingStore = createDirectoryBrowsingStore(directoryGateway);
    directoryBrowsingStore.getState().setShowHidden(settingsStore.getState().settings.browsing.showHiddenFiles);
    const navigationStore = createNavigationStore({
      openDirectory: directoryBrowsingStore.getState().openDirectory,
    });
    const searchStore = createSearchStore({
      gateway: searchGateway,
      currentDirectoryPath: () => directoryBrowsingStore.getState().listing?.path ?? null,
    });

    const stopBindingSearch = bindSearch({ searchStore, directoryBrowsingStore });
    const stopBindingSettings = bindSettings({ settingsStore, directoryBrowsingStore });
    void navigationStore
      .getState()
      .navigateTo(startPath)
      .then(() => {
        const hasNothingOpen = directoryBrowsingStore.getState().listing === null;
        if (startPath !== undefined && hasNothingOpen) void navigationStore.getState().navigateTo(undefined);
      });

    return {
      id: `session-${++sessionCount}`,
      directoryBrowsingStore,
      navigationStore,
      searchStore,
      dispose: () => {
        stopBindingSearch();
        stopBindingSettings();
        searchStore.getState().close();
      },
    };
  };
}
