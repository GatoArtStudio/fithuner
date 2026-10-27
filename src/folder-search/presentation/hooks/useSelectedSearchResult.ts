import { useMemo } from "react";
import type { SearchMatch } from "../../domain/entities/search";
import { useSearch } from "../context/SearchContext";

export function useSelectedSearchResult(): SearchMatch | null {
  const matches = useSearch((state) => state.matches);
  const selectedPath = useSearch((state) => state.selectedPath);

  return useMemo(() => matches.find((found) => found.path === selectedPath) ?? null, [matches, selectedPath]);
}
