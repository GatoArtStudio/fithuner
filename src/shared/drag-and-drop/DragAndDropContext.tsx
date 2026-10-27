import { createContext, useContext, type ReactNode } from "react";
import { useStore } from "zustand";
import type { DragSessionState, DragSessionStore } from "./drag-session-store";

export interface DropRequest {
  paths: string[];
  targetPath: string;
  isCopy: boolean;
}

export interface DragAndDropConfig {
  store: DragSessionStore;
  canDrop: (paths: string[], targetPath: string) => boolean;
  onDrop: (request: DropRequest) => void;
}

const DragAndDropContext = createContext<DragAndDropConfig | null>(null);

interface DragAndDropProviderProps extends DragAndDropConfig {
  children: ReactNode;
}

export function DragAndDropProvider({ children, ...config }: DragAndDropProviderProps) {
  return <DragAndDropContext.Provider value={config}>{children}</DragAndDropContext.Provider>;
}

export function useDragAndDropConfig(): DragAndDropConfig {
  const config = useContext(DragAndDropContext);
  if (!config) throw new Error("Drag and drop hooks must be used inside DragAndDropProvider");
  return config;
}

export function useDragSession<Selected>(selector: (state: DragSessionState) => Selected): Selected {
  return useStore(useDragAndDropConfig().store, selector);
}
