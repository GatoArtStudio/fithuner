import { describe, expect, it } from "vitest";
import { fileNameOf, validateEntryName } from "./validate-entry-name";

describe("validateEntryName", () => {
  it.each(["notes.txt", ".gitignore", "My folder", "archive (2).zip"])("accepts %s", (name) => {
    expect(validateEntryName(name)).toBeNull();
  });

  it.each(["", "   ", ".", "..", "a/b", "a\\b", "what?", "star*", "ends.", "ends ", "tab\tname"])(
    "rejects %j",
    (name) => {
      expect(validateEntryName(name)).not.toBeNull();
    },
  );

  it("rejects names longer than 255 bytes", () => {
    expect(validateEntryName("a".repeat(256))).not.toBeNull();
    expect(validateEntryName("a".repeat(255))).toBeNull();
  });
});

describe("fileNameOf", () => {
  it("returns the last segment of posix and windows paths", () => {
    expect(fileNameOf("/home/user/notes.txt")).toBe("notes.txt");
    expect(fileNameOf("C:\\Users\\me\\notes.txt")).toBe("notes.txt");
  });
});
