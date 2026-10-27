import type { UndoableAction } from "../entities/undoable-action";

export const MAX_HISTORY_SIZE = 50;

export interface UndoHistory {
  undoable: UndoableAction[];
  redoable: UndoableAction[];
}

export const EMPTY_HISTORY: UndoHistory = { undoable: [], redoable: [] };

function capped(actions: UndoableAction[]): UndoableAction[] {
  return actions.slice(-MAX_HISTORY_SIZE);
}

/** A new action replaces whatever could have been redone. */
export function recordAction(history: UndoHistory, action: UndoableAction): UndoHistory {
  return { undoable: capped([...history.undoable, action]), redoable: [] };
}

export function takeUndoable(history: UndoHistory): { action: UndoableAction; rest: UndoHistory } | null {
  const action = history.undoable[history.undoable.length - 1];
  if (!action) return null;
  return { action, rest: { ...history, undoable: history.undoable.slice(0, -1) } };
}

export function takeRedoable(history: UndoHistory): { action: UndoableAction; rest: UndoHistory } | null {
  const action = history.redoable[history.redoable.length - 1];
  if (!action) return null;
  return { action, rest: { ...history, redoable: history.redoable.slice(0, -1) } };
}

export function markUndone(history: UndoHistory, action: UndoableAction): UndoHistory {
  return { ...history, redoable: capped([...history.redoable, action]) };
}

export function markRedone(history: UndoHistory, action: UndoableAction): UndoHistory {
  return { ...history, undoable: capped([...history.undoable, action]) };
}
