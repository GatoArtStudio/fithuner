import type { FolderWatchGateway } from "../folder-watching";
import type { SettingsStore } from "../settings";
import type { WorkspaceStore } from "../workspace";
import type { BrowsingSession } from "./browsing-session";

interface BindFolderWatchingDependencies {
  workspaceStore: WorkspaceStore<BrowsingSession>;
  settingsStore: SettingsStore;
  gateway: FolderWatchGateway;
  debounceMillis?: number;
}

/** Keeps the backend watching the folders the sessions show and reloads a session when its folder changes. */
export function bindFolderWatching({
  workspaceStore,
  settingsStore,
  gateway,
  debounceMillis = 100,
}: BindFolderWatchingDependencies) {
  const folderSubscriptions = new Map<string, () => void>();
  const changedFolders = new Set<string>();
  let reloadTimer: ReturnType<typeof setTimeout> | undefined;
  let lastWatched = "";

  function sessions(): BrowsingSession[] {
    return Object.values(workspaceStore.getState().sessions);
  }

  function syncWatchedFolders() {
    const shouldWatch = settingsStore.getState().settings.browsing.watchFolders;
    const folders = shouldWatch
      ? [
          ...new Set(
            sessions().flatMap((session) => session.directoryBrowsingStore.getState().listing?.path ?? []),
          ),
        ].sort()
      : [];
    const signature = JSON.stringify(folders);
    if (signature === lastWatched) return;
    lastWatched = signature;
    void gateway.watch(folders).catch(() => {
      lastWatched = "";
    });
  }

  function followSessions() {
    const current = new Map(sessions().map((session) => [session.id, session.directoryBrowsingStore]));
    for (const [sessionId, stop] of folderSubscriptions) {
      if (current.has(sessionId)) continue;
      stop();
      folderSubscriptions.delete(sessionId);
    }
    for (const [sessionId, store] of current) {
      if (folderSubscriptions.has(sessionId)) continue;
      folderSubscriptions.set(
        sessionId,
        store.subscribe((state, previous) => {
          if (state.listing?.path !== previous.listing?.path) syncWatchedFolders();
        }),
      );
    }
    syncWatchedFolders();
  }

  function reloadChangedFolders() {
    reloadTimer = undefined;
    const folders = new Set(changedFolders);
    changedFolders.clear();
    for (const session of sessions()) {
      const directory = session.directoryBrowsingStore.getState();
      if (directory.listing && folders.has(directory.listing.path)) void directory.reload();
    }
  }

  const stopFollowingWorkspace = workspaceStore.subscribe((state, previous) => {
    if (state.sessions !== previous.sessions) followSessions();
  });
  const stopFollowingSettings = settingsStore.subscribe((state, previous) => {
    if (state.settings.browsing.watchFolders !== previous.settings.browsing.watchFolders) syncWatchedFolders();
  });
  followSessions();

  return {
    handleFolderChanged: (folder: string) => {
      changedFolders.add(folder);
      if (reloadTimer === undefined) reloadTimer = setTimeout(reloadChangedFolders, debounceMillis);
    },
    dispose: () => {
      stopFollowingWorkspace();
      stopFollowingSettings();
      folderSubscriptions.forEach((stop) => stop());
      folderSubscriptions.clear();
      clearTimeout(reloadTimer);
    },
  };
}
