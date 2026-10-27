import { createStore, type StoreApi } from "zustand/vanilla";
import {
  EMPTY_HISTORY,
  canGoBack,
  canGoForward,
  currentPath,
  stepBack,
  stepForward,
  visit,
  type NavigationHistory,
} from "../../domain/value-objects/navigation-history";

export interface NavigationState {
  history: NavigationHistory;
  navigateTo: (path?: string) => Promise<void>;
  goBack: () => Promise<void>;
  goForward: () => Promise<void>;
}

export type NavigationStore = StoreApi<NavigationState>;

export interface NavigationDependencies {
  openDirectory: (path?: string) => Promise<string | null>;
}

export function selectCanGoBack(state: NavigationState): boolean {
  return canGoBack(state.history);
}

export function selectCanGoForward(state: NavigationState): boolean {
  return canGoForward(state.history);
}

export function createNavigationStore({ openDirectory }: NavigationDependencies): NavigationStore {
  return createStore<NavigationState>((set, get) => {
    async function moveInHistory(step: (history: NavigationHistory) => NavigationHistory) {
      const target = step(get().history);
      const targetPath = currentPath(target);
      if (targetPath === null || target === get().history) return;

      const openedPath = await openDirectory(targetPath);
      if (openedPath !== null) set({ history: target });
    }

    return {
      history: EMPTY_HISTORY,
      navigateTo: async (path) => {
        const openedPath = await openDirectory(path);
        if (openedPath !== null) set({ history: visit(get().history, openedPath) });
      },

      goBack: () => moveInHistory(stepBack),
      goForward: () => moveInHistory(stepForward),
    };
  });
}
