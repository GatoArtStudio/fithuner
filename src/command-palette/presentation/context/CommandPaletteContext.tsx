import { createContext, useContext, type ReactNode } from "react";
import { useStore } from "zustand";
import type { CommandPaletteState, CommandPaletteStore } from "../../application/stores/command-palette-store";

const CommandPaletteContext = createContext<CommandPaletteStore | null>(null);

interface CommandPaletteProviderProps {
  store: CommandPaletteStore;
  children: ReactNode;
}

export function CommandPaletteProvider({ store, children }: CommandPaletteProviderProps) {
  return <CommandPaletteContext.Provider value={store}>{children}</CommandPaletteContext.Provider>;
}

export function useCommandPalette<Selected>(selector: (state: CommandPaletteState) => Selected): Selected {
  const store = useContext(CommandPaletteContext);
  if (!store) throw new Error("useCommandPalette must be used inside CommandPaletteProvider");
  return useStore(store, selector);
}
