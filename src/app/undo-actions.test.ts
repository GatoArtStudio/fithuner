import { describe, expect, it } from "vitest";
import type { FinishedTransfer } from "../file-transfer";
import { undoActionFromOperation, undoActionFromTransfer } from "./undo-actions";

function finished(mode: "copy" | "move", transferred: { from: string; to: string }[], error: string | null = null): FinishedTransfer {
  return {
    request: { sources: transferred.map((entry) => entry.from), destinationDirectory: "/dest", mode },
    result: {
      transferId: "t1",
      transferredFiles: transferred.length,
      skipped: [],
      failed: [],
      cancelled: false,
      transferred,
      error,
    },
  };
}

describe("undoActionFromOperation", () => {
  it("maps rename, create and trash events", () => {
    expect(undoActionFromOperation({ type: "renamed", from: "/a", to: "/b" })).toEqual({ type: "rename", from: "/a", to: "/b" });
    expect(undoActionFromOperation({ type: "created", path: "/a" })).toEqual({ type: "create", path: "/a" });
    expect(undoActionFromOperation({ type: "trashed", paths: ["/a"] })).toEqual({ type: "trash", paths: ["/a"] });
  });
});

describe("undoActionFromTransfer", () => {
  it("turns a move into exact moves", () => {
    const moves = [{ from: "/src/a", to: "/dest/a" }];

    expect(undoActionFromTransfer(finished("move", moves))).toEqual({ type: "move", moves });
  });

  it("turns a copy into the paths of the new copies", () => {
    const action = undoActionFromTransfer(finished("copy", [{ from: "/src/a", to: "/dest/a (2)" }]));

    expect(action).toEqual({ type: "copy", paths: ["/dest/a (2)"] });
  });

  it("records nothing when nothing new was created or the transfer failed", () => {
    expect(undoActionFromTransfer(finished("copy", []))).toBeNull();
    expect(undoActionFromTransfer(finished("move", [{ from: "/a", to: "/b" }], "disk full"))).toBeNull();
  });
});
