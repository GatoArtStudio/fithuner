import { createStore, type StoreApi } from "zustand/vanilla";
import type { PaletteItem, RankedPaletteItem } from "../../domain/entities/palette-item";
import { rankPaletteItems } from "../../domain/services/rank-palette-items";

export interface CommandPaletteState {
  isOpen: boolean;
  query: string;
  results: RankedPaletteItem[];
  selectedIndex: number;
  open: () => void;
  close: () => void;
  setQuery: (query: string) => void;
  moveSelection: (delta: number) => void;
  selectIndex: (index: number) => void;
  runSelected: () => void;
  runItem: (item: PaletteItem) => void;
}

export type CommandPaletteStore = StoreApi<CommandPaletteState>;

export interface CommandPaletteDependencies {
  /** Builds the items for the current query; typed-text entries depend on it. */
  getItems: (query: string) => PaletteItem[];
}

export function createCommandPaletteStore({ getItems }: CommandPaletteDependencies): CommandPaletteStore {
  return createStore<CommandPaletteState>((set, get) => {
    function recompute(query: string) {
      set({ query, results: rankPaletteItems(getItems(query), query), selectedIndex: 0 });
    }

    function runItem(item: PaletteItem) {
      set({ isOpen: false });
      item.run();
    }

    return {
      isOpen: false,
      query: "",
      results: [],
      selectedIndex: 0,

      open: () => {
        set({ isOpen: true });
        recompute("");
      },

      close: () => set({ isOpen: false, query: "", results: [], selectedIndex: 0 }),

      setQuery: recompute,

      moveSelection: (delta) => {
        const { results, selectedIndex } = get();
        if (results.length === 0) return;
        set({ selectedIndex: (selectedIndex + delta + results.length) % results.length });
      },

      selectIndex: (index) => set({ selectedIndex: index }),

      runSelected: () => {
        const selected = get().results[get().selectedIndex];
        if (selected) runItem(selected.item);
      },

      runItem,
    };
  });
}
