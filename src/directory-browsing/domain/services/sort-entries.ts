import type { FileEntry } from "../entities/file-entry";

export type SortKey = "name" | "modified" | "size" | "type";
export type SortDirection = "ascending" | "descending";

export interface SortCriteria {
  key: SortKey;
  direction: SortDirection;
}

export const DEFAULT_SORT: SortCriteria = { key: "name", direction: "ascending" };

const nameCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

export function fileExtension(entry: FileEntry): string {
  if (entry.kind === "directory") return "";
  const dotIndex = entry.name.lastIndexOf(".");
  return dotIndex > 0 ? entry.name.slice(dotIndex + 1).toLowerCase() : "";
}

function compareByKey(first: FileEntry, second: FileEntry, key: SortKey): number {
  switch (key) {
    case "name":
      return nameCollator.compare(first.name, second.name);
    case "size":
      return first.sizeInBytes - second.sizeInBytes;
    case "modified":
      return (first.modifiedAtMillis ?? 0) - (second.modifiedAtMillis ?? 0);
    case "type":
      return nameCollator.compare(fileExtension(first), fileExtension(second));
  }
}

export function sortEntries(entries: FileEntry[], criteria: SortCriteria): FileEntry[] {
  const directionFactor = criteria.direction === "ascending" ? 1 : -1;

  return [...entries].sort((first, second) => {
    if (first.kind !== second.kind) {
      return first.kind === "directory" ? -1 : 1;
    }
    const byKey = compareByKey(first, second, criteria.key) * directionFactor;
    return byKey !== 0 ? byKey : nameCollator.compare(first.name, second.name);
  });
}

export function filterVisibleEntries(entries: FileEntry[], showHidden: boolean): FileEntry[] {
  return showHidden ? entries : entries.filter((entry) => !entry.isHidden);
}
