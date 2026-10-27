import { createStore, type StoreApi } from "zustand/vanilla";
import type { DirectoryError, DirectoryListing } from "../../domain/entities/file-entry";
import { DEFAULT_SORT, type SortCriteria, type SortKey } from "../../domain/services/sort-entries";
import type { DirectoryGateway } from "../ports/directory-gateway";

export interface DirectoryBrowsingState {
  listing: DirectoryListing | null;
  isLoading: boolean;
  error: DirectoryError | null;
  sort: SortCriteria;
  showHidden: boolean;
  selectedPaths: string[];
  openDirectory: (path?: string) => Promise<string | null>;
  refresh: () => Promise<void>;
  toggleSort: (key: SortKey) => void;
  toggleShowHidden: () => void;
  setShowHidden: (showHidden: boolean) => void;
  selectOnly: (path: string) => void;
  toggleSelection: (path: string) => void;
  clearSelection: () => void;
}

export type DirectoryBrowsingStore = StoreApi<DirectoryBrowsingState>;

const UNEXPECTED_ERROR: DirectoryError = {
  kind: "unexpected",
  message: "Something went wrong while reading the folder",
};

function toDirectoryError(failure: unknown): DirectoryError {
  if (typeof failure === "object" && failure !== null && "kind" in failure && "message" in failure) {
    return failure as DirectoryError;
  }
  return UNEXPECTED_ERROR;
}

export function createDirectoryBrowsingStore(gateway: DirectoryGateway): DirectoryBrowsingStore {
  let latestRequestId = 0;

  return createStore<DirectoryBrowsingState>((set, get) => ({
    listing: null,
    isLoading: false,
    error: null,
    sort: DEFAULT_SORT,
    showHidden: false,
    selectedPaths: [],

    openDirectory: async (path) => {
      const requestId = ++latestRequestId;
      set({ isLoading: true, error: null });

      try {
        const listing = await gateway.listDirectory(path);
        if (requestId !== latestRequestId) return null;
        set({ listing, isLoading: false, selectedPaths: [] });
        return listing.path;
      } catch (failure) {
        if (requestId !== latestRequestId) return null;
        set({ isLoading: false, error: toDirectoryError(failure) });
        return null;
      }
    },

    refresh: async () => {
      const currentPath = get().listing?.path;
      if (currentPath) await get().openDirectory(currentPath);
    },

    toggleSort: (key) =>
      set(({ sort }) => ({
        sort:
          sort.key === key
            ? { key, direction: sort.direction === "ascending" ? "descending" : "ascending" }
            : { key, direction: "ascending" },
      })),

    toggleShowHidden: () => set(({ showHidden }) => ({ showHidden: !showHidden })),

    setShowHidden: (showHidden) => set({ showHidden }),

    selectOnly: (path) => set({ selectedPaths: [path] }),

    toggleSelection: (path) =>
      set(({ selectedPaths }) => ({
        selectedPaths: selectedPaths.includes(path)
          ? selectedPaths.filter((selectedPath) => selectedPath !== path)
          : [...selectedPaths, path],
      })),

    clearSelection: () => set({ selectedPaths: [] }),
  }));
}
