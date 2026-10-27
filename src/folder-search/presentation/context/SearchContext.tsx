import { createContext, useContext, type ReactNode } from "react";
import { useStore } from "zustand";
import type { SearchState, SearchStore } from "../../application/stores/search-store";

const SearchContext = createContext<SearchStore | null>(null);

interface SearchProviderProps {
  store: SearchStore;
  children: ReactNode;
}

export function SearchProvider({ store, children }: SearchProviderProps) {
  return <SearchContext.Provider value={store}>{children}</SearchContext.Provider>;
}

export function useSearch<Selected>(selector: (state: SearchState) => Selected): Selected {
  const store = useContext(SearchContext);
  if (!store) throw new Error("useSearch must be used inside SearchProvider");
  return useStore(store, selector);
}
