import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { SearchGateway } from "../../../application/ports/search-gateway";
import type { SearchError, SearchMatch, SearchSummary } from "../../../domain/entities/search";

interface FinishedPayload extends SearchSummary {
  searchId: string;
  error: SearchError | null;
}

export const tauriSearchGateway: SearchGateway = {
  startSearch: (request) => invoke<string>("start_search", { request }),
  cancelSearch: (searchId) => invoke<void>("cancel_search", { searchId }),

  subscribe: async (listener) => {
    const unsubscribes = await Promise.all([
      listen<{ searchId: string; matches: SearchMatch[] }>("search-matches", ({ payload }) =>
        listener({ type: "matches", searchId: payload.searchId, matches: payload.matches }),
      ),
      listen<FinishedPayload>("search-finished", ({ payload }) =>
        listener({
          type: "finished",
          searchId: payload.searchId,
          summary: {
            totalMatches: payload.totalMatches,
            scannedEntries: payload.scannedEntries,
            isTruncated: payload.isTruncated,
            wasCancelled: payload.wasCancelled,
          },
          error: payload.error,
        }),
      ),
    ]);
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  },
};
