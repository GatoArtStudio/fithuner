import type { Pane } from "./pane";

export const MIN_SPLIT_RATIO = 0.2;
export const MAX_SPLIT_RATIO = 0.8;

export interface Workspace {
  panes: Pane[];
  activePaneId: string;
  splitRatio: number;
}
