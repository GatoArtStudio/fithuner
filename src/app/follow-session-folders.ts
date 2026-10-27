import type { WorkspaceStore } from "../workspace";
import type { BrowsingSession } from "./browsing-session";

/** Calls `onChange` when sessions come or go and whenever a session moves to another folder. */
export function followSessionFolders(
  workspaceStore: WorkspaceStore<BrowsingSession>,
  onChange: () => void,
): () => void {
  const folderSubscriptions = new Map<string, () => void>();

  function followSessions() {
    const current = new Map(
      Object.values(workspaceStore.getState().sessions).map((session) => [session.id, session.directoryBrowsingStore]),
    );
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
          if (state.listing?.path !== previous.listing?.path) onChange();
        }),
      );
    }
  }

  const stopFollowingWorkspace = workspaceStore.subscribe((state, previous) => {
    if (state.sessions === previous.sessions) return;
    followSessions();
    onChange();
  });
  followSessions();

  return () => {
    stopFollowingWorkspace();
    folderSubscriptions.forEach((stop) => stop());
    folderSubscriptions.clear();
  };
}
