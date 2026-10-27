import type { PathMove } from "../../domain/entities/undoable-action";

export interface UndoBatchResult {
  succeeded: string[];
  failed: { path: string; error: { message: string } }[];
}

export interface UndoGateway {
  moveEntries(moves: PathMove[]): Promise<UndoBatchResult>;
  trashEntries(paths: string[]): Promise<UndoBatchResult>;
  restoreEntries(paths: string[]): Promise<UndoBatchResult>;
}
