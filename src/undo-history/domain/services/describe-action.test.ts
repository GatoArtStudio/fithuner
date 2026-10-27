import { describe, expect, it } from "vitest";
import type { UndoableAction } from "../entities/undoable-action";
import { describeAction } from "./describe-action";

describe("describeAction", () => {
  it.each<[UndoableAction, string]>([
    [{ type: "rename", from: "/docs/a.txt", to: "/docs/b.txt" }, "renaming “a.txt”"],
    [{ type: "create", path: "/docs/New folder" }, "creating “New folder”"],
    [{ type: "trash", paths: ["/docs/a.txt"] }, "moving “a.txt” to the trash"],
    [{ type: "trash", paths: ["/docs/a.txt", "/docs/b.txt"] }, "moving 2 items to the trash"],
    [{ type: "move", moves: [{ from: "C:\\docs\\a.txt", to: "C:\\other\\a.txt" }] }, "moving “a.txt”"],
    [{ type: "move", moves: [{ from: "/a/1", to: "/b/1" }, { from: "/a/2", to: "/b/2" }, { from: "/a/3", to: "/b/3" }] }, "moving 3 items"],
    [{ type: "copy", paths: ["/b/a (2).txt"] }, "copying “a (2).txt”"],
  ])("describes %j", (action, expected) => {
    expect(describeAction(action)).toBe(expected);
  });
});
