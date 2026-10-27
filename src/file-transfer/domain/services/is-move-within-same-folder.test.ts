import { describe, expect, it } from "vitest";
import { isMoveWithinSameFolder } from "./is-move-within-same-folder";

describe("isMoveWithinSameFolder", () => {
  it("detects entries already inside the destination", () => {
    expect(isMoveWithinSameFolder(["/home/a.txt", "/home/photos"], "/home")).toBe(true);
    expect(isMoveWithinSameFolder(["/home/a.txt"], "/home/")).toBe(true);
    expect(isMoveWithinSameFolder(["/a.txt"], "/")).toBe(true);
    expect(isMoveWithinSameFolder(["C:\\data\\a.txt"], "C:\\data")).toBe(true);
  });

  it("accepts moves that change the folder", () => {
    expect(isMoveWithinSameFolder(["/home/a.txt"], "/home/docs")).toBe(false);
    expect(isMoveWithinSameFolder(["/home/a.txt", "/other/b.txt"], "/home")).toBe(false);
  });

  it("ignores an empty selection", () => {
    expect(isMoveWithinSameFolder([], "/home")).toBe(false);
  });
});
