import { createContext, useContext, type ReactNode } from "react";
import { useStore } from "zustand";
import type { NavigationState, NavigationStore } from "../application/navigation-store";

const NavigationContext = createContext<NavigationStore | null>(null);

interface NavigationProviderProps {
  store: NavigationStore;
  children: ReactNode;
}

export function NavigationProvider({ store, children }: NavigationProviderProps) {
  return <NavigationContext.Provider value={store}>{children}</NavigationContext.Provider>;
}

export function useNavigation<Selected>(selector: (state: NavigationState) => Selected): Selected {
  const store = useContext(NavigationContext);
  if (!store) throw new Error("useNavigation must be used inside NavigationProvider");
  return useStore(store, selector);
}
