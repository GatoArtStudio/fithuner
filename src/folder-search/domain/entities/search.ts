export type SearchKindFilter =
  | "all"
  | "folders"
  | "files"
  | "images"
  | "documents"
  | "audio"
  | "video"
  | "archives"
  | "code";

export interface SearchMatch {
  path: string;
  name: string;
  relativeFolder: string;
  kind: "file" | "directory";
  sizeInBytes: number;
  modifiedAtMillis: number | null;
}

export interface SearchRequest {
  root: string;
  text: string;
  includeHidden: boolean;
  kindFilter: SearchKindFilter;
}

export interface SearchSummary {
  totalMatches: number;
  scannedEntries: number;
  isTruncated: boolean;
  wasCancelled: boolean;
}

export interface SearchError {
  kind: "notFound" | "permissionDenied" | "notADirectory" | "emptyQuery" | "unexpected";
  message: string;
}

export type SearchEvent =
  | { type: "matches"; searchId: string; matches: SearchMatch[] }
  | { type: "finished"; searchId: string; summary: SearchSummary; error: SearchError | null };

export type SearchStatus =
  | { type: "idle" }
  | { type: "searching" }
  | { type: "done"; summary: SearchSummary }
  | { type: "error"; error: SearchError };

export const SEARCH_KIND_FILTERS: { value: SearchKindFilter; label: string }[] = [
  { value: "all", label: "Everything" },
  { value: "folders", label: "Folders" },
  { value: "files", label: "Files" },
  { value: "images", label: "Images" },
  { value: "documents", label: "Documents" },
  { value: "audio", label: "Audio" },
  { value: "video", label: "Video" },
  { value: "archives", label: "Archives" },
  { value: "code", label: "Code" },
];
