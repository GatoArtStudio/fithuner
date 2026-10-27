export type { Pane } from "./domain/entities/pane";
export type { Tab } from "./domain/entities/tab";
export type { Workspace } from "./domain/entities/workspace";
export { createWorkspaceStore, selectActiveSession } from "./application/stores/workspace-store";
export type {
  WorkspaceSession,
  WorkspaceState,
  WorkspaceStore,
} from "./application/stores/workspace-store";
export { TabBar } from "./presentation/components/TabBar";
export { WorkspaceProvider, useWorkspace } from "./presentation/context/WorkspaceContext";
export { useWorkspaceShortcuts } from "./presentation/hooks/useWorkspaceShortcuts";
