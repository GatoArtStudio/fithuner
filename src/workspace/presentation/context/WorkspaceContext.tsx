import { createContext, useContext, type ReactNode } from "react";
import { useStore } from "zustand";
import type {
  WorkspaceSession,
  WorkspaceState,
  WorkspaceStore,
} from "../../application/stores/workspace-store";

const WorkspaceContext = createContext<WorkspaceStore<WorkspaceSession> | null>(null);

interface WorkspaceProviderProps<Session extends WorkspaceSession> {
  store: WorkspaceStore<Session>;
  children: ReactNode;
}

export function WorkspaceProvider<Session extends WorkspaceSession>({
  store,
  children,
}: WorkspaceProviderProps<Session>) {
  return (
    <WorkspaceContext.Provider value={store as unknown as WorkspaceStore<WorkspaceSession>}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace<Session extends WorkspaceSession, Selected>(
  selector: (state: WorkspaceState<Session>) => Selected,
): Selected {
  const store = useContext(WorkspaceContext);
  if (!store) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return useStore(store as unknown as WorkspaceStore<Session>, selector);
}
