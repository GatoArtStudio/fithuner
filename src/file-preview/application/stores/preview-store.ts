import { createStore, type StoreApi } from "zustand/vanilla";

export interface PreviewState {
  isQuickLookOpen: boolean;
  forcedPaths: string[];
  openQuickLook: () => void;
  closeQuickLook: () => void;
  toggleQuickLook: () => void;
  forcePreview: (path: string) => void;
}

export type PreviewStore = StoreApi<PreviewState>;

export function createPreviewStore(): PreviewStore {
  return createStore<PreviewState>((set) => ({
    isQuickLookOpen: false,
    forcedPaths: [],
    openQuickLook: () => set({ isQuickLookOpen: true }),
    closeQuickLook: () => set({ isQuickLookOpen: false }),
    toggleQuickLook: () => set(({ isQuickLookOpen }) => ({ isQuickLookOpen: !isQuickLookOpen })),
    forcePreview: (path) =>
      set(({ forcedPaths }) => (forcedPaths.includes(path) ? {} : { forcedPaths: [...forcedPaths, path] })),
  }));
}
