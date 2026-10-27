import { createContext, useContext, type ReactNode } from "react";
import { useStore } from "zustand";
import type { UndoState, UndoStore } from "../../application/stores/undo-store";

const UndoContext = createContext<UndoStore | null>(null);

interface UndoProviderProps {
  store: UndoStore;
  children: ReactNode;
}

export function UndoProvider({ store, children }: UndoProviderProps) {
  return <UndoContext.Provider value={store}>{children}</UndoContext.Provider>;
}

export function useUndo<Selected>(selector: (state: UndoState) => Selected): Selected {
  const store = useContext(UndoContext);
  if (!store) throw new Error("useUndo must be used inside UndoProvider");
  return useStore(store, selector);
}
