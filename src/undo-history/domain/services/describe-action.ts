import type { UndoableAction } from "../entities/undoable-action";

function baseName(path: string): string {
  return path.split(/[\\/]/).filter(Boolean).pop() ?? path;
}

function items(paths: string[]): string {
  return paths.length === 1 ? `“${baseName(paths[0])}”` : `${paths.length} items`;
}

/** A short phrase that completes "Undo ..." and "Undid ...". */
export function describeAction(action: UndoableAction): string {
  switch (action.type) {
    case "rename":
      return `renaming “${baseName(action.from)}”`;
    case "create":
      return `creating “${baseName(action.path)}”`;
    case "trash":
      return `moving ${items(action.paths)} to the trash`;
    case "move":
      return `moving ${items(action.moves.map((move) => move.from))}`;
    case "copy":
      return `copying ${items(action.paths)}`;
  }
}
