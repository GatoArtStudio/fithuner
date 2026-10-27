import type { PaletteItem } from "../command-palette";

export interface CommandOptions {
  shortcut?: string;
  keywords?: string[];
  isAvailable?: boolean;
}

export function command(id: string, title: string, run: () => void, options: CommandOptions = {}): PaletteItem | null {
  if (options.isAvailable === false) return null;
  return { id: `command:${id}`, title, group: "commands", run, shortcut: options.shortcut, keywords: options.keywords };
}
