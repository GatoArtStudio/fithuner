function withTrailingSeparator(path: string): string {
  return /[\\/]$/.test(path) ? path : `${path}${path.includes("\\") && !path.includes("/") ? "\\" : "/"}`;
}

export function isValidDropTarget(draggedPaths: string[], targetPath: string): boolean {
  return draggedPaths.every(
    (draggedPath) =>
      draggedPath !== targetPath &&
      !withTrailingSeparator(targetPath).startsWith(withTrailingSeparator(draggedPath)),
  );
}
