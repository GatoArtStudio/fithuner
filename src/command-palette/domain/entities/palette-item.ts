export type PaletteGroup = "go-to-path" | "commands" | "places" | "search";

export interface PaletteItem {
  id: string;
  title: string;
  subtitle?: string;
  group: PaletteGroup;
  shortcut?: string;
  keywords?: string[];
  /** Typed-text entries (go to path, search) are shown whatever the fuzzy score is. */
  alwaysVisible?: boolean;
  run: () => void;
}

export interface RankedPaletteItem {
  item: PaletteItem;
  titleIndices: number[];
}

export const GROUP_ORDER: PaletteGroup[] = ["go-to-path", "commands", "places", "search"];

export const GROUP_LABELS: Record<PaletteGroup, string> = {
  "go-to-path": "Go to path",
  commands: "Commands",
  places: "Folders and places",
  search: "Search",
};
