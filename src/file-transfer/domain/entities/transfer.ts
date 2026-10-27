export type TransferMode = "copy" | "move";

export interface TransferRequest {
  sources: string[];
  destinationDirectory: string;
  mode: TransferMode;
}

export interface TransferProgress {
  transferId: string;
  bytesDone: number;
  bytesTotal: number;
  filesDone: number;
  filesTotal: number;
  currentPath: string;
}

export type ConflictResolution = "replace" | "skip" | "keepBoth" | "cancel";

export interface ConflictDecision {
  resolution: ConflictResolution;
  applyToAll: boolean;
}

export interface ConflictEntryInfo {
  kind: "file" | "directory" | "symlink";
  sizeInBytes: number;
  modifiedAtMillis: number | null;
}

export interface TransferConflict {
  transferId: string;
  source: string;
  target: string;
  sourceInfo: ConflictEntryInfo;
  targetInfo: ConflictEntryInfo;
}

export interface FailedTransfer {
  path: string;
  message: string;
}

export interface TransferFinished {
  transferId: string;
  transferredFiles: number;
  skipped: string[];
  failed: FailedTransfer[];
  cancelled: boolean;
  error: string | null;
}

export type TransferEvent =
  | { type: "progress"; progress: TransferProgress }
  | { type: "conflict"; conflict: TransferConflict }
  | { type: "finished"; finished: TransferFinished };

export type ExternalDragEvent =
  | { type: "enter" | "over"; position: { x: number; y: number } }
  | { type: "drop"; paths: string[]; position: { x: number; y: number } }
  | { type: "leave" };
