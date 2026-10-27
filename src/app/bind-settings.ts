import type { DirectoryBrowsingStore } from "../directory-browsing";
import type { SettingsStore } from "../settings";

interface BindSettingsStores {
  settingsStore: SettingsStore;
  directoryBrowsingStore: DirectoryBrowsingStore;
}

export function bindSettings({ settingsStore, directoryBrowsingStore }: BindSettingsStores) {
  const stopFollowingSettings = settingsStore.subscribe((state, previousState) => {
    const { showHiddenFiles } = state.settings.browsing;
    if (showHiddenFiles !== previousState.settings.browsing.showHiddenFiles) {
      directoryBrowsingStore.getState().setShowHidden(showHiddenFiles);
    }
  });

  const stopFollowingToolbar = directoryBrowsingStore.subscribe((state, previousState) => {
    if (state.showHidden === previousState.showHidden) return;
    if (state.showHidden !== settingsStore.getState().settings.browsing.showHiddenFiles) {
      void settingsStore.getState().update({ browsing: { showHiddenFiles: state.showHidden } });
    }
  });

  return () => {
    stopFollowingSettings();
    stopFollowingToolbar();
  };
}
