const DROP_PATH_ATTRIBUTE = "data-drop-path";
const DROP_HOVER_ATTRIBUTE = "data-drop-hover";

export function findDropTargetAt(x: number, y: number): string | null {
  const element = document.elementFromPoint(x, y);
  return element?.closest(`[${DROP_PATH_ATTRIBUTE}]`)?.getAttribute(DROP_PATH_ATTRIBUTE) ?? null;
}

export function highlightDropTarget(path: string | null) {
  document.querySelectorAll(`[${DROP_HOVER_ATTRIBUTE}]`).forEach((element) => {
    element.removeAttribute(DROP_HOVER_ATTRIBUTE);
  });
  if (path === null) return;
  document.querySelectorAll(`[${DROP_PATH_ATTRIBUTE}]`).forEach((element) => {
    if (element.getAttribute(DROP_PATH_ATTRIBUTE) === path) {
      element.setAttribute(DROP_HOVER_ATTRIBUTE, "true");
    }
  });
}

export function lastPathSegment(path: string): string {
  return path.split(/[\\/]/).filter(Boolean).pop() ?? path;
}
