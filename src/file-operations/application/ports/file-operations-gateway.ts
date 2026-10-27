import type { BatchOutcome, EntryMove, NewEntryKind } from "../../domain/entities/file-operation";

export interface FileOperationsGateway {
  openEntry(path: string): Promise<void>;
  createEntry(parentPath: string, kind: NewEntryKind): Promise<string>;
  renameEntry(path: string, newName: string): Promise<string>;
  trashEntries(paths: string[]): Promise<BatchOutcome>;
  deleteEntriesPermanently(paths: string[]): Promise<BatchOutcome>;
  moveEntries(moves: EntryMove[]): Promise<BatchOutcome>;
  restoreEntries(paths: string[]): Promise<BatchOutcome>;
}
