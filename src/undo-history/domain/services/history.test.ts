import { describe, expect, it } from "vitest";
import type { UndoableAction } from "../entities/undoable-action";
import {
  EMPTY_HISTORY,
  MAX_HISTORY_SIZE,
  markRedone,
  markUndone,
  recordAction,
  takeRedoable,
  takeUndoable,
} from "./history";

const create = (name: string): UndoableAction => ({ type: "create", path: `/docs/${name}` });

describe("undo history", () => {
  it("starts empty", () => {
    expect(takeUndoable(EMPTY_HISTORY)).toBeNull();
    expect(takeRedoable(EMPTY_HISTORY)).toBeNull();
  });

  it("takes the most recent action first", () => {
    const history = recordAction(recordAction(EMPTY_HISTORY, create("a")), create("b"));

    const taken = takeUndoable(history);

    expect(taken?.action).toEqual(create("b"));
    expect(taken?.rest.undoable).toEqual([create("a")]);
  });

  it("moves an action between the stacks when it is undone and redone", () => {
    const recorded = recordAction(EMPTY_HISTORY, create("a"));
    const { action, rest } = takeUndoable(recorded)!;

    const undone = markUndone(rest, action);
    expect(undone).toEqual({ undoable: [], redoable: [create("a")] });

    const { action: again, rest: afterTake } = takeRedoable(undone)!;
    expect(markRedone(afterTake, again)).toEqual({ undoable: [create("a")], redoable: [] });
  });

  it("forgets what could be redone when a new action is recorded", () => {
    const undone = markUndone(EMPTY_HISTORY, create("a"));

    expect(recordAction(undone, create("b")).redoable).toEqual([]);
  });

  it("keeps only the most recent actions", () => {
    let history = EMPTY_HISTORY;
    for (let index = 0; index < MAX_HISTORY_SIZE + 5; index++) history = recordAction(history, create(`f${index}`));

    expect(history.undoable).toHaveLength(MAX_HISTORY_SIZE);
    expect(history.undoable[0]).toEqual(create("f5"));
  });
});
