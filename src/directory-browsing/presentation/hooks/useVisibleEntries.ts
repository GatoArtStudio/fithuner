import { useMemo } from "react";
import type { FileEntry } from "../../domain/entities/file-entry";
import { filterVisibleEntries, sortEntries } from "../../domain/services/sort-entries";
import { useDirectoryBrowsing } from "../context/DirectoryBrowsingContext";

export function useVisibleEntries(): FileEntry[] {
  const listing = useDirectoryBrowsing((state) => state.listing);
  const sort = useDirectoryBrowsing((state) => state.sort);
  const showHidden = useDirectoryBrowsing((state) => state.showHidden);

  return useMemo(
    () => sortEntries(filterVisibleEntries(listing?.entries ?? [], showHidden), sort),
    [listing, showHidden, sort],
  );
}
