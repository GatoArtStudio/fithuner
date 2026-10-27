import { describe, expect, it } from "vitest";
import { isValidDropTarget } from "./is-valid-drop-target";

describe("isValidDropTarget", () => {
  it("accepts unrelated folders", () => {
    expect(isValidDropTarget(["/home/a.txt", "/home/photos"], "/home/docs")).toBe(true);
  });

  it("rejects dropping an entry onto itself", () => {
    expect(isValidDropTarget(["/home/photos"], "/home/photos")).toBe(false);
  });

  it("rejects dropping a folder into its own descendants", () => {
    expect(isValidDropTarget(["/home/photos"], "/home/photos/2024")).toBe(false);
    expect(isValidDropTarget(["C:\\photos"], "C:\\photos\\2024")).toBe(false);
  });

  it("does not confuse folders that only share a name prefix", () => {
    expect(isValidDropTarget(["/home/photos"], "/home/photos-backup")).toBe(true);
  });
});
