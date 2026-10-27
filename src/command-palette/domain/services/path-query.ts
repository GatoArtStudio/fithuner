export function isPathLike(query: string): boolean {
  const text = query.trim();
  return text.startsWith("/") || text.startsWith("~") || /^[A-Za-z]:[\\/]/.test(text) || text.startsWith("\\\\");
}

/** Turns `~` and `~/...` into the home folder; any other text is returned trimmed. */
export function expandHome(query: string, homePath: string | null): string {
  const text = query.trim();
  if (homePath === null || !(text === "~" || text.startsWith("~/") || text.startsWith("~\\"))) return text;

  const separator = homePath.includes("\\") && !homePath.includes("/") ? "\\" : "/";
  const base = homePath.replace(/[\\/]+$/, "");
  const rest = text.slice(1).replace(/^[\\/]+/, "");
  return rest === "" ? base : `${base}${separator}${rest}`;
}
