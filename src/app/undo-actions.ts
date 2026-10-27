import type { FileOperationEvent } from "../file-operations";
import type { FinishedTransfer } from "../file-transfer";
import type { UndoableAction } from "../undo-history";

export function undoActionFromOperation(event: FileOperationEvent): UndoableAction {
  switch (event.type) {
    case "renamed":
      return { type: "rename", from: event.from, to: event.to };
    case "created":
      return { type: "create", path: event.path };
    case "trashed":
      return { type: "trash", paths: event.paths };
  }
}

/** Only entries the transfer newly created can be undone; replacements and merges never are. */
export function undoActionFromTransfer({ request, result }: FinishedTransfer): UndoableAction | null {
  if (result.error || result.transferred.length === 0) return null;
  if (request.mode === "move") return { type: "move", moves: result.transferred };
  return { type: "copy", paths: result.transferred.map((entry) => entry.to) };
}
