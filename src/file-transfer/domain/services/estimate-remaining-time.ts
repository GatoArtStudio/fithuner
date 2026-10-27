export function transferPercent(bytesDone: number, bytesTotal: number, filesDone = 0, filesTotal = 0): number {
  if (bytesTotal > 0) return Math.min(100, Math.round((bytesDone / bytesTotal) * 100));
  if (filesTotal > 0) return Math.min(100, Math.round((filesDone / filesTotal) * 100));
  return 0;
}

export function estimateRemainingSeconds(
  bytesDone: number,
  bytesTotal: number,
  elapsedMillis: number,
): number | null {
  if (bytesDone <= 0 || elapsedMillis <= 0 || bytesTotal <= bytesDone) return null;
  const bytesPerSecond = bytesDone / (elapsedMillis / 1000);
  return Math.ceil((bytesTotal - bytesDone) / bytesPerSecond);
}

export function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 60) return `${minutes}m ${totalSeconds % 60}s`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}
