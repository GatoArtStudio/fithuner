export interface AvailableUpdate {
  version: string;
  notes: string | null;
  publishedAtMillis: number | null;
}

export interface UpdateCheckResult {
  currentVersion: string;
  available: AvailableUpdate | null;
}

export type UpdateErrorKind =
  | "notConfigured"
  | "network"
  | "invalidSignature"
  | "notSupported"
  | "noUpdateAvailable"
  | "nothingDownloaded"
  | "unexpected";

export interface UpdateError {
  kind: UpdateErrorKind;
  message: string;
}

export interface DownloadProgress {
  downloadedBytes: number;
  totalBytes: number | null;
}

export type DownloadEvent =
  | { type: "progress"; progress: DownloadProgress }
  | { type: "finished"; error: UpdateError | null };

export type UpdateStep = "check" | "download" | "install";

export type UpdateStatus =
  | { type: "idle" }
  | { type: "checking" }
  | { type: "up-to-date" }
  | { type: "available"; update: AvailableUpdate }
  | { type: "downloading"; update: AvailableUpdate; progress: DownloadProgress | null }
  | { type: "ready"; update: AvailableUpdate }
  | { type: "installing"; update: AvailableUpdate }
  | { type: "error"; step: UpdateStep; error: UpdateError; update: AvailableUpdate | null };
