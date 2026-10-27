import { createStore, type StoreApi } from "zustand/vanilla";
import type { UndoableAction } from "../../domain/entities/undoable-action";
import { describeAction } from "../../domain/services/describe-action";
import {
  EMPTY_HISTORY,
  markRedone,
  markUndone,
  recordAction,
  takeRedoable,
  takeUndoable,
  type UndoHistory,
} from "../../domain/services/history";
import type { UndoBatchResult, UndoGateway } from "../ports/undo-gateway";

export interface UndoState {
  history: UndoHistory;
  isBusy: boolean;
  record: (action: UndoableAction) => void;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
}

export type UndoStore = StoreApi<UndoState>;

export interface UndoDependencies {
  gateway: UndoGateway;
  afterChange: () => Promise<void> | void;
  notify: (message: string, tone: "info" | "error") => void;
}

type Direction = "undo" | "redo";

function reversed(action: Extract<UndoableAction, { type: "rename" | "move" }>) {
  const moves = action.type === "rename" ? [{ from: action.from, to: action.to }] : action.moves;
  return moves.map((move) => ({ from: move.to, to: move.from }));
}

function forward(action: Extract<UndoableAction, { type: "rename" | "move" }>) {
  return action.type === "rename" ? [{ from: action.from, to: action.to }] : action.moves;
}

export function selectUndoLabel(state: UndoState): string | null {
  const action = state.history.undoable[state.history.undoable.length - 1];
  return action ? describeAction(action) : null;
}

export function selectRedoLabel(state: UndoState): string | null {
  const action = state.history.redoable[state.history.redoable.length - 1];
  return action ? describeAction(action) : null;
}

export function createUndoStore({ gateway, afterChange, notify }: UndoDependencies): UndoStore {
  function apply(action: UndoableAction, direction: Direction): Promise<UndoBatchResult> {
    switch (action.type) {
      case "rename":
      case "move":
        return gateway.moveEntries(direction === "undo" ? reversed(action) : forward(action));
      case "create":
        return direction === "undo" ? gateway.trashEntries([action.path]) : gateway.restoreEntries([action.path]);
      case "copy":
        return direction === "undo" ? gateway.trashEntries(action.paths) : gateway.restoreEntries(action.paths);
      case "trash":
        return direction === "undo" ? gateway.restoreEntries(action.paths) : gateway.trashEntries(action.paths);
    }
  }

  return createStore<UndoState>((set, get) => {
    async function run(direction: Direction) {
      const { history, isBusy } = get();
      if (isBusy) return;
      const taken = direction === "undo" ? takeUndoable(history) : takeRedoable(history);
      if (!taken) return;

      const { action, rest } = taken;
      const verb = direction === "undo" ? "undo" : "redo";
      set({ history: rest, isBusy: true });

      try {
        const outcome = await apply(action, direction);
        const [failure] = outcome.failed;
        if (failure) {
          notify(`Could not ${verb} ${describeAction(action)}: ${failure.error.message}`, "error");
        } else {
          set(({ history: current }) => ({
            history: direction === "undo" ? markUndone(current, action) : markRedone(current, action),
          }));
          notify(`${direction === "undo" ? "Undid" : "Redid"} ${describeAction(action)}`, "info");
        }
      } catch (failure) {
        const reason = failure instanceof Error ? failure.message : "Something went wrong";
        notify(`Could not ${verb} ${describeAction(action)}: ${reason}`, "error");
      } finally {
        set({ isBusy: false });
        await afterChange();
      }
    }

    return {
      history: EMPTY_HISTORY,
      isBusy: false,
      record: (action) => set(({ history }) => ({ history: recordAction(history, action) })),
      undo: () => run("undo"),
      redo: () => run("redo"),
    };
  });
}
