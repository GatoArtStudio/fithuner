import { createContext, useContext, type ReactNode } from "react";
import { useStore } from "zustand";
import type { SettingsState, SettingsStore } from "../../application/stores/settings-store";

const SettingsContext = createContext<SettingsStore | null>(null);

interface SettingsProviderProps {
  store: SettingsStore;
  children: ReactNode;
}

export function SettingsProvider({ store, children }: SettingsProviderProps) {
  return <SettingsContext.Provider value={store}>{children}</SettingsContext.Provider>;
}

export function useSettings<Selected>(selector: (state: SettingsState) => Selected): Selected {
  const store = useContext(SettingsContext);
  if (!store) throw new Error("useSettings must be used inside SettingsProvider");
  return useStore(store, selector);
}
