import { createContext, useContext, type ReactNode } from "react";
import { useStore } from "zustand";
import type { UpdatesState, UpdatesStore } from "../../application/stores/updates-store";

const UpdatesContext = createContext<UpdatesStore | null>(null);

interface UpdatesProviderProps {
  store: UpdatesStore;
  children: ReactNode;
}

export function UpdatesProvider({ store, children }: UpdatesProviderProps) {
  return <UpdatesContext.Provider value={store}>{children}</UpdatesContext.Provider>;
}

export function useUpdates<Selected>(selector: (state: UpdatesState) => Selected): Selected {
  const store = useContext(UpdatesContext);
  if (!store) throw new Error("useUpdates must be used inside UpdatesProvider");
  return useStore(store, selector);
}
