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
} from "../domain/navigation-history";
import type { Place } from "../domain/place";
import type { PlacesGateway } from "./places-gateway";

export interface NavigationState {
  history: NavigationHistory;
  places: Place[];
  loadPlaces: () => Promise<void>;
  navigateTo: (path?: string) => Promise<void>;
  goBack: () => Promise<void>;
  goForward: () => Promise<void>;
}

export type NavigationStore = StoreApi<NavigationState>;

export interface NavigationDependencies {
  placesGateway: PlacesGateway;
  openDirectory: (path?: string) => Promise<string | null>;
}

export function selectCanGoBack(state: NavigationState): boolean {
  return canGoBack(state.history);
}

export function selectCanGoForward(state: NavigationState): boolean {
  return canGoForward(state.history);
}

export function createNavigationStore({
  placesGateway,
  openDirectory,
}: NavigationDependencies): NavigationStore {
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
      places: [],

      loadPlaces: async () => {
        try {
          set({ places: await placesGateway.listPlaces() });
        } catch {
          set({ places: [] });
        }
      },

      navigateTo: async (path) => {
        const openedPath = await openDirectory(path);
        if (openedPath !== null) set({ history: visit(get().history, openedPath) });
      },

      goBack: () => moveInHistory(stepBack),
      goForward: () => moveInHistory(stepForward),
    };
  });
}
