export interface PaneLayout {
  paths: string[];
  activeIndex: number;
}

export interface WorkspaceLayout {
  panes: PaneLayout[];
  activePaneIndex: number;
  splitRatio: number;
}
