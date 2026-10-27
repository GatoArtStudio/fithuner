import { createStore, type StoreApi } from "zustand/vanilla";
import type {
  SearchError,
  SearchEvent,
  SearchKindFilter,
  SearchMatch,
  SearchStatus,
} from "../../domain/entities/search";
import type { SearchGateway } from "../ports/search-gateway";

export interface SearchState {
  isOpen: boolean;
  text: string;
  kindFilter: SearchKindFilter;
  includeHidden: boolean;
  status: SearchStatus;
  matches: SearchMatch[];
  selectedPath: string | null;
  open: (initialText?: string) => void;
  close: () => void;
  setText: (text: string) => void;
  setKindFilter: (kindFilter: SearchKindFilter) => void;
  toggleIncludeHidden: () => void;
  select: (path: string | null) => void;
  moveSelection: (delta: number) => void;
  handleEvent: (event: SearchEvent) => void;
}

export type SearchStore = StoreApi<SearchState>;

export interface SearchDependencies {
  gateway: SearchGateway;
  currentDirectoryPath: () => string | null;
  debounceMillis?: number;
}

function toSearchError(failure: unknown): SearchError {
  if (typeof failure === "object" && failure !== null && "kind" in failure && "message" in failure) {
    return failure as SearchError;
  }
  return { kind: "unexpected", message: "The search could not be started" };
}

export function createSearchStore({
  gateway,
  currentDirectoryPath,
  debounceMillis = 200,
}: SearchDependencies): SearchStore {
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let activeSearchId: string | null = null;
  let requestSerial = 0;
  let eventsBeforeId: SearchEvent[] = [];

  return createStore<SearchState>((set, get) => {
    function cancelRunning() {
      clearTimeout(debounceTimer);
      requestSerial++;
      eventsBeforeId = [];
      if (activeSearchId !== null) void gateway.cancelSearch(activeSearchId);
      activeSearchId = null;
    }

    function applyEvent(event: SearchEvent) {
      if (event.type === "matches") {
        set(({ matches, selectedPath }) => {
          const merged = [...matches, ...event.matches];
          return { matches: merged, selectedPath: selectedPath ?? merged[0]?.path ?? null };
        });
      } else if (event.error) {
        set({ status: { type: "error", error: event.error } });
      } else if (!event.summary.wasCancelled) {
        set({ status: { type: "done", summary: event.summary } });
      }
    }

    async function startSearch() {
      cancelRunning();
      const { text, includeHidden, kindFilter } = get();
      const root = currentDirectoryPath();
      if (text.trim() === "" || root === null) {
        set({ status: { type: "idle" }, matches: [], selectedPath: null });
        return;
      }

      set({ status: { type: "searching" }, matches: [], selectedPath: null });
      const serial = requestSerial;
      let searchId: string;
      try {
        searchId = await gateway.startSearch({ root, text, includeHidden, kindFilter });
      } catch (failure) {
        if (serial === requestSerial) set({ status: { type: "error", error: toSearchError(failure) } });
        return;
      }
      if (serial !== requestSerial) {
        void gateway.cancelSearch(searchId);
        return;
      }
      activeSearchId = searchId;
      const early = eventsBeforeId.filter((event) => event.searchId === searchId);
      eventsBeforeId = [];
      early.forEach(applyEvent);
    }

    return {
      isOpen: false,
      text: "",
      kindFilter: "all",
      includeHidden: false,
      status: { type: "idle" },
      matches: [],
      selectedPath: null,

      open: (initialText) => {
        set({ isOpen: true });
        if (initialText !== undefined) {
          set({ text: initialText });
          void startSearch();
        }
      },

      close: () => {
        cancelRunning();
        set({ isOpen: false, text: "", status: { type: "idle" }, matches: [], selectedPath: null });
      },

      setText: (text) => {
        set({ text });
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => void startSearch(), debounceMillis);
      },

      setKindFilter: (kindFilter) => {
        set({ kindFilter });
        void startSearch();
      },

      toggleIncludeHidden: () => {
        set(({ includeHidden }) => ({ includeHidden: !includeHidden }));
        void startSearch();
      },

      select: (path) => set({ selectedPath: path }),

      moveSelection: (delta) => {
        const { matches, selectedPath } = get();
        if (matches.length === 0) return;
        const currentIndex = matches.findIndex((found) => found.path === selectedPath);
        const nextIndex = Math.min(matches.length - 1, Math.max(0, currentIndex + delta));
        set({ selectedPath: matches[nextIndex].path });
      },

      handleEvent: (event) => {
        if (activeSearchId === null) {
          if (get().status.type === "searching") eventsBeforeId.push(event);
          return;
        }
        if (event.searchId === activeSearchId) applyEvent(event);
      },
    };
  });
}
