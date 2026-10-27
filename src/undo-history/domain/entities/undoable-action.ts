export interface PathMove {
  from: string;
  to: string;
}

export type UndoableAction =
  | { type: "rename"; from: string; to: string }
  | { type: "create"; path: string }
  | { type: "trash"; paths: string[] }
  | { type: "move"; moves: PathMove[] }
  | { type: "copy"; paths: string[] };
