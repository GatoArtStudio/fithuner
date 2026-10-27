import type { DownloadProgress, UpdateError } from "../entities/update";

export function downloadPercent(progress: DownloadProgress | null): number | null {
  if (!progress || progress.totalBytes === null || progress.totalBytes <= 0) return null;
  return Math.min(100, Math.round((progress.downloadedBytes / progress.totalBytes) * 100));
}

export function describeUpdateError(error: UpdateError): string {
  switch (error.kind) {
    case "network":
      return "Could not reach the update server. Check your connection and try again.";
    case "invalidSignature":
      return "The downloaded update could not be verified, so it was discarded.";
    case "notSupported":
      return "This installation cannot update itself. Download the new version from the release page.";
    case "notConfigured":
      return "Updates are not configured for this build.";
    default:
      return error.message;
  }
}

export function formatReleaseDate(publishedAtMillis: number | null): string | null {
  if (publishedAtMillis === null) return null;
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(publishedAtMillis);
}
