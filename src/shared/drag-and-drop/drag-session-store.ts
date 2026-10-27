import { createStore, type StoreApi } from "zustand/vanilla";

export interface DragSession {
  label: string;
  itemCount: number;
  x: number;
  y: number;
  hoverPath: string | null;
  isCopy: boolean;
}

export interface DragSessionState {
  session: DragSession | null;
  begin: (session: DragSession) => void;
  update: (changes: Partial<DragSession>) => void;
  end: () => void;
}

export type DragSessionStore = StoreApi<DragSessionState>;

export function createDragSessionStore(): DragSessionStore {
  return createStore<DragSessionState>((set) => ({
    session: null,
    begin: (session) => set({ session }),
    update: (changes) =>
      set(({ session }) => (session ? { session: { ...session, ...changes } } : {})),
    end: () => set({ session: null }),
  }));
}
