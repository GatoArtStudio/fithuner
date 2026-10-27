import { createContext, useContext, type ReactNode } from "react";
import { useStore } from "zustand";
import type { PlacesState, PlacesStore } from "../../application/stores/places-store";

const PlacesContext = createContext<PlacesStore | null>(null);

interface PlacesProviderProps {
  store: PlacesStore;
  children: ReactNode;
}

export function PlacesProvider({ store, children }: PlacesProviderProps) {
  return <PlacesContext.Provider value={store}>{children}</PlacesContext.Provider>;
}

export function usePlaces<Selected>(selector: (state: PlacesState) => Selected): Selected {
  const store = useContext(PlacesContext);
  if (!store) throw new Error("usePlaces must be used inside PlacesProvider");
  return useStore(store, selector);
}
