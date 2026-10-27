import type { ReactNode } from "react";
import { DirectoryBrowsingProvider } from "../directory-browsing";
import { SearchProvider } from "../folder-search";
import { NavigationProvider } from "../navigation";
import type { BrowsingSession } from "./browsing-session";

interface SessionProvidersProps {
  session: BrowsingSession;
  children: ReactNode;
}

export function SessionProviders({ session, children }: SessionProvidersProps) {
  return (
    <DirectoryBrowsingProvider store={session.directoryBrowsingStore}>
      <NavigationProvider store={session.navigationStore}>
        <SearchProvider store={session.searchStore}>{children}</SearchProvider>
      </NavigationProvider>
    </DirectoryBrowsingProvider>
  );
}
