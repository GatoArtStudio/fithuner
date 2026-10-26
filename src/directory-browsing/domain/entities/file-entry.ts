export type FileEntryKind = "file" | "directory";

export interface FileEntry {
  name: string;
  path: string;
  kind: FileEntryKind;
  isSymlink: boolean;
  isHidden: boolean;
  sizeInBytes: number;
  modifiedAtMillis: number | null;
}

export interface DirectoryListing {
  path: string;
  parentPath: string | null;
  entries: FileEntry[];
}

export type DirectoryErrorKind =
  | "notFound"
  | "permissionDenied"
  | "notADirectory"
  | "unexpected";

export interface DirectoryError {
  kind: DirectoryErrorKind;
  message: string;
}
