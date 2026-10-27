const REASONS: Record<number, string> = {
  1: "playback was aborted",
  2: "a network error interrupted the download",
  3: "the media could not be decoded",
  4: "the format is not supported by the system's media backend",
};

export function describeMediaError(error: { code: number; message?: string } | null): string {
  if (!error) return "The player reported an unknown error";
  const reason = REASONS[error.code] ?? "unknown reason";
  const technical = error.message ? ` (${error.message})` : "";
  return `Playback failed: ${reason}${technical}`;
}
