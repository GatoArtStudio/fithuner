function parentOf(path: string): string {
  return path.replace(/[\\/][^\\/]*$/, "") || "/";
}

function withoutTrailingSeparator(path: string): string {
  return path.length > 1 ? path.replace(/[\\/]+$/, "") : path;
}

export function isMoveWithinSameFolder(sources: string[], destinationDirectory: string): boolean {
  const destination = withoutTrailingSeparator(destinationDirectory);
  return sources.length > 0 && sources.every((source) => parentOf(source) === destination);
}
