import type { ReactNode } from "react";
import { useStore } from "zustand";
import { DirectoryBrowsingProvider } from "../directory-browsing";
import { SearchProvider } from "../folder-search";
import { NavigationProvider } from "../navigation";
import { selectActiveSession, type WorkspaceStore } from "../workspace";
import type { BrowsingSession } from "./browsing-session";

interface ActiveSessionProps {
  workspaceStore: WorkspaceStore<BrowsingSession>;
  children: ReactNode;
}

export function ActiveSession({ workspaceStore, children }: ActiveSessionProps) {
  const session = useStore(workspaceStore, selectActiveSession);

  return (
    <DirectoryBrowsingProvider store={session.directoryBrowsingStore}>
      <NavigationProvider store={session.navigationStore}>
        <SearchProvider store={session.searchStore}>{children}</SearchProvider>
      </NavigationProvider>
    </DirectoryBrowsingProvider>
  );
}
