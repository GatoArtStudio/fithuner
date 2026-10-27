import type { SettingsStore } from "../settings";
import { layoutOf, type WorkspaceLayoutGateway, type WorkspaceStore } from "../workspace";
import type { BrowsingSession } from "./browsing-session";
import { followSessionFolders } from "./follow-session-folders";

interface BindWorkspacePersistenceDependencies {
  workspaceStore: WorkspaceStore<BrowsingSession>;
  settingsStore: SettingsStore;
  gateway: WorkspaceLayoutGateway;
  debounceMillis?: number;
}

/**
 * Brings back the saved tabs and panes, then keeps the saved layout up to date.
 * Call it once the settings are loaded, so the transient start layout never replaces the saved one.
 */
export function startWorkspacePersistence({
  workspaceStore,
  settingsStore,
  gateway,
  debounceMillis = 500,
}: BindWorkspacePersistenceDependencies): () => void {
  let saveTimer: ReturnType<typeof setTimeout> | undefined;

  const isEnabled = () => settingsStore.getState().settings.browsing.restoreTabsOnStartup;

  function saveNow() {
    clearTimeout(saveTimer);
    saveTimer = undefined;
    if (!isEnabled()) {
      gateway.clear();
      return;
    }
    const { workspace, sessions } = workspaceStore.getState();
    const layout = layoutOf(
      workspace,
      (sessionId) => sessions[sessionId]?.directoryBrowsingStore.getState().listing?.path,
    );
    if (layout) gateway.save(layout);
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, debounceMillis);
  }

  if (isEnabled()) {
    const saved = gateway.load();
    if (saved) workspaceStore.getState().restoreLayout(saved);
  }

  const stopFollowingFolders = followSessionFolders(workspaceStore, scheduleSave);
  const stopFollowingLayout = workspaceStore.subscribe((state, previous) => {
    if (state.workspace !== previous.workspace) scheduleSave();
  });
  const stopFollowingSettings = settingsStore.subscribe((state, previous) => {
    if (state.settings.browsing.restoreTabsOnStartup !== previous.settings.browsing.restoreTabsOnStartup) saveNow();
  });
  window.addEventListener("pagehide", saveNow);
  window.addEventListener("beforeunload", saveNow);

  return () => {
    stopFollowingFolders();
    stopFollowingLayout();
    stopFollowingSettings();
    window.removeEventListener("pagehide", saveNow);
    window.removeEventListener("beforeunload", saveNow);
    clearTimeout(saveTimer);
  };
}
