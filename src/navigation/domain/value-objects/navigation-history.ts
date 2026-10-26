export interface NavigationHistory {
  paths: string[];
  currentIndex: number;
}

export const EMPTY_HISTORY: NavigationHistory = { paths: [], currentIndex: -1 };

export function currentPath(history: NavigationHistory): string | null {
  return history.paths[history.currentIndex] ?? null;
}

export function canGoBack(history: NavigationHistory): boolean {
  return history.currentIndex > 0;
}

export function canGoForward(history: NavigationHistory): boolean {
  return history.currentIndex < history.paths.length - 1;
}

export function visit(history: NavigationHistory, path: string): NavigationHistory {
  if (currentPath(history) === path) return history;
  const keptPaths = history.paths.slice(0, history.currentIndex + 1);
  return { paths: [...keptPaths, path], currentIndex: keptPaths.length };
}

export function stepBack(history: NavigationHistory): NavigationHistory {
  return canGoBack(history) ? { ...history, currentIndex: history.currentIndex - 1 } : history;
}

export function stepForward(history: NavigationHistory): NavigationHistory {
  return canGoForward(history) ? { ...history, currentIndex: history.currentIndex + 1 } : history;
}
