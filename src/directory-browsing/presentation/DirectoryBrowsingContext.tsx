import { createContext, useContext, type ReactNode } from "react";
import { useStore } from "zustand";
import type { DirectoryBrowsingState, DirectoryBrowsingStore } from "../application/directory-browsing-store";

const DirectoryBrowsingContext = createContext<DirectoryBrowsingStore | null>(null);

interface DirectoryBrowsingProviderProps {
  store: DirectoryBrowsingStore;
  children: ReactNode;
}

export function DirectoryBrowsingProvider({ store, children }: DirectoryBrowsingProviderProps) {
  return (
    <DirectoryBrowsingContext.Provider value={store}>{children}</DirectoryBrowsingContext.Provider>
  );
}

export function useDirectoryBrowsing<Selected>(
  selector: (state: DirectoryBrowsingState) => Selected,
): Selected {
  const store = useContext(DirectoryBrowsingContext);
  if (!store) throw new Error("useDirectoryBrowsing must be used inside DirectoryBrowsingProvider");
  return useStore(store, selector);
}
