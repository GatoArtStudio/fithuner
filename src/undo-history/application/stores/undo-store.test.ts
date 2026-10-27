import { describe, expect, it, vi } from "vitest";
import type { UndoableAction } from "../../domain/entities/undoable-action";
import type { UndoBatchResult, UndoGateway } from "../ports/undo-gateway";
import { createUndoStore, selectRedoLabel, selectUndoLabel } from "./undo-store";

const ok: UndoBatchResult = { succeeded: [], failed: [] };

function setup(overrides: Partial<UndoGateway> = {}) {
  const gateway: UndoGateway = {
    moveEntries: vi.fn().mockResolvedValue(ok),
    trashEntries: vi.fn().mockResolvedValue(ok),
    restoreEntries: vi.fn().mockResolvedValue(ok),
    ...overrides,
  };
  const afterChange = vi.fn();
  const notify = vi.fn();
  const store = createUndoStore({ gateway, afterChange, notify });
  return { store, gateway, afterChange, notify };
}

const rename: UndoableAction = { type: "rename", from: "/docs/a.txt", to: "/docs/b.txt" };

describe("undo store", () => {
  describe("undo and redo of every action", () => {
    it("undoes and redoes a rename with exact moves", async () => {
      const { store, gateway } = setup();
      store.getState().record(rename);

      await store.getState().undo();
      expect(gateway.moveEntries).toHaveBeenLastCalledWith([{ from: "/docs/b.txt", to: "/docs/a.txt" }]);

      await store.getState().redo();
      expect(gateway.moveEntries).toHaveBeenLastCalledWith([{ from: "/docs/a.txt", to: "/docs/b.txt" }]);
    });

    it("undoes and redoes a move of several entries", async () => {
      const { store, gateway } = setup();
      const moves = [
        { from: "/a/1", to: "/b/1" },
        { from: "/a/2", to: "/b/2" },
      ];
      store.getState().record({ type: "move", moves });

      await store.getState().undo();
      expect(gateway.moveEntries).toHaveBeenLastCalledWith([
        { from: "/b/1", to: "/a/1" },
        { from: "/b/2", to: "/a/2" },
      ]);

      await store.getState().redo();
      expect(gateway.moveEntries).toHaveBeenLastCalledWith(moves);
    });

    it("undoes a creation by trashing it and redoes it by restoring it", async () => {
      const { store, gateway } = setup();
      store.getState().record({ type: "create", path: "/docs/New folder" });

      await store.getState().undo();
      expect(gateway.trashEntries).toHaveBeenLastCalledWith(["/docs/New folder"]);

      await store.getState().redo();
      expect(gateway.restoreEntries).toHaveBeenLastCalledWith(["/docs/New folder"]);
    });

    it("undoes a copy by trashing the copies and redoes it by restoring them", async () => {
      const { store, gateway } = setup();
      store.getState().record({ type: "copy", paths: ["/b/a (2).txt"] });

      await store.getState().undo();
      expect(gateway.trashEntries).toHaveBeenLastCalledWith(["/b/a (2).txt"]);

      await store.getState().redo();
      expect(gateway.restoreEntries).toHaveBeenLastCalledWith(["/b/a (2).txt"]);
    });

    it("undoes a trash by restoring and redoes it by trashing again", async () => {
      const { store, gateway } = setup();
      store.getState().record({ type: "trash", paths: ["/docs/a.txt", "/docs/b.txt"] });

      await store.getState().undo();
      expect(gateway.restoreEntries).toHaveBeenLastCalledWith(["/docs/a.txt", "/docs/b.txt"]);

      await store.getState().redo();
      expect(gateway.trashEntries).toHaveBeenLastCalledWith(["/docs/a.txt", "/docs/b.txt"]);
    });
  });

  it("walks back through several actions in reverse order", async () => {
    const { store, gateway } = setup();
    store.getState().record({ type: "create", path: "/docs/one" });
    store.getState().record(rename);

    await store.getState().undo();
    await store.getState().undo();

    expect(vi.mocked(gateway.moveEntries)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(gateway.trashEntries)).toHaveBeenCalledWith(["/docs/one"]);
    expect(store.getState().history.undoable).toEqual([]);
    expect(store.getState().history.redoable).toHaveLength(2);
  });

  it("does nothing when there is nothing to undo or redo", async () => {
    const { store, gateway, notify, afterChange } = setup();

    await store.getState().undo();
    await store.getState().redo();

    expect(gateway.moveEntries).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
    expect(afterChange).not.toHaveBeenCalled();
  });

  it("announces what was undone and refreshes afterwards", async () => {
    const { store, notify, afterChange } = setup();
    store.getState().record(rename);

    await store.getState().undo();

    expect(notify).toHaveBeenCalledWith("Undid renaming “a.txt”", "info");
    expect(afterChange).toHaveBeenCalledTimes(1);
  });

  it("reports why an action failed and drops it so the history does not get stuck", async () => {
    const { store, notify } = setup({
      moveEntries: vi.fn().mockResolvedValue({
        succeeded: [],
        failed: [{ path: "/docs/b.txt", error: { message: "The item does not exist" } }],
      }),
    });
    store.getState().record({ type: "create", path: "/docs/earlier" });
    store.getState().record(rename);

    await store.getState().undo();

    expect(notify).toHaveBeenCalledWith(
      "Could not undo renaming “a.txt”: The item does not exist",
      "error",
    );
    expect(store.getState().history.redoable).toEqual([]);
    expect(store.getState().history.undoable).toEqual([{ type: "create", path: "/docs/earlier" }]);
    expect(store.getState().isBusy).toBe(false);
  });

  it("recovers when the gateway itself throws", async () => {
    const { store, notify, afterChange } = setup({ moveEntries: vi.fn().mockRejectedValue(new Error("boom")) });
    store.getState().record(rename);

    await store.getState().undo();

    expect(notify).toHaveBeenCalledWith("Could not undo renaming “a.txt”: boom", "error");
    expect(store.getState().isBusy).toBe(false);
    expect(afterChange).toHaveBeenCalled();
  });

  it("ignores a second request while one is running", async () => {
    let finish: (result: UndoBatchResult) => void = () => {};
    const moveEntries = vi.fn().mockImplementation(() => new Promise<UndoBatchResult>((resolve) => (finish = resolve)));
    const { store } = setup({ moveEntries });
    store.getState().record(rename);
    store.getState().record({ type: "move", moves: [{ from: "/a", to: "/b" }] });

    const first = store.getState().undo();
    await store.getState().undo();
    finish(ok);
    await first;

    expect(moveEntries).toHaveBeenCalledTimes(1);
    expect(store.getState().history.undoable).toHaveLength(1);
  });

  it("forgets what could be redone when something new happens", async () => {
    const { store } = setup();
    store.getState().record(rename);
    await store.getState().undo();
    expect(selectRedoLabel(store.getState())).toBe("renaming “a.txt”");

    store.getState().record({ type: "create", path: "/docs/new" });

    expect(selectRedoLabel(store.getState())).toBeNull();
    expect(selectUndoLabel(store.getState())).toBe("creating “new”");
  });
});
