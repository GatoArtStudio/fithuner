export type NewEntryKind = "file" | "directory";

export type FileOperationErrorKind =
  | "alreadyExists"
  | "notFound"
  | "permissionDenied"
  | "invalidName"
  | "unexpected";

export interface FileOperationError {
  kind: FileOperationErrorKind;
  message: string;
}

export interface FailedEntry {
  path: string;
  error: FileOperationError;
}

export interface BatchOutcome {
  succeeded: string[];
  failed: FailedEntry[];
}

export interface EntryReference {
  path: string;
  kind: "file" | "directory";
}
