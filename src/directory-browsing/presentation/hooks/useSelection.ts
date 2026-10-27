import { useMemo } from "react";
import type { FileEntry } from "../../domain/entities/file-entry";
import { useDirectoryBrowsing } from "../context/DirectoryBrowsingContext";

export function useSelectedEntry(): FileEntry | null {
  const listing = useDirectoryBrowsing((state) => state.listing);
  const selectedPaths = useDirectoryBrowsing((state) => state.selectedPaths);
  const lastSelectedPath = selectedPaths[selectedPaths.length - 1];

  return useMemo(
    () => listing?.entries.find((entry) => entry.path === lastSelectedPath) ?? null,
    [listing, lastSelectedPath],
  );
}

export function useSelectionCount(): number {
  return useDirectoryBrowsing((state) => state.selectedPaths.length);
}
