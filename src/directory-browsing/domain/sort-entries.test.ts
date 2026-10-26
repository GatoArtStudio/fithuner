import { describe, expect, it } from "vitest";
import type { FileEntry } from "./file-entry";
import { filterVisibleEntries, sortEntries } from "./sort-entries";

function entry(overrides: Partial<FileEntry> & { name: string }): FileEntry {
  return {
    path: `/${overrides.name}`,
    kind: "file",
    isSymlink: false,
    isHidden: false,
    sizeInBytes: 0,
    modifiedAtMillis: null,
    ...overrides,
  };
}

const names = (entries: FileEntry[]) => entries.map((item) => item.name);

describe("sortEntries", () => {
  it("keeps directories before files regardless of direction", () => {
    const entries = [
      entry({ name: "b.txt" }),
      entry({ name: "folder", kind: "directory" }),
      entry({ name: "a.txt" }),
    ];

    expect(names(sortEntries(entries, { key: "name", direction: "descending" }))).toEqual([
      "folder",
      "b.txt",
      "a.txt",
    ]);
  });

  it("sorts names naturally so file2 comes before file10", () => {
    const entries = [entry({ name: "file10" }), entry({ name: "file2" })];

    expect(names(sortEntries(entries, { key: "name", direction: "ascending" }))).toEqual([
      "file2",
      "file10",
    ]);
  });

  it("sorts by size and falls back to name on ties", () => {
    const entries = [
      entry({ name: "big", sizeInBytes: 10 }),
      entry({ name: "b", sizeInBytes: 1 }),
      entry({ name: "a", sizeInBytes: 1 }),
    ];

    expect(names(sortEntries(entries, { key: "size", direction: "ascending" }))).toEqual([
      "a",
      "b",
      "big",
    ]);
  });

  it("sorts by extension when sorting by type", () => {
    const entries = [entry({ name: "x.zip" }), entry({ name: "y.avi" })];

    expect(names(sortEntries(entries, { key: "type", direction: "ascending" }))).toEqual([
      "y.avi",
      "x.zip",
    ]);
  });
});

describe("filterVisibleEntries", () => {
  const entries = [entry({ name: ".env", isHidden: true }), entry({ name: "app.ts" })];

  it("hides hidden entries by default", () => {
    expect(names(filterVisibleEntries(entries, false))).toEqual(["app.ts"]);
  });

  it("keeps everything when hidden entries are shown", () => {
    expect(filterVisibleEntries(entries, true)).toHaveLength(2);
  });
});
