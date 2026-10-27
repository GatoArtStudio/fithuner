import { describe, expect, it } from "vitest";
import { fuzzyMatch } from "./fuzzy-match";

describe("fuzzyMatch", () => {
  it("returns null when the letters do not appear in order", () => {
    expect(fuzzyMatch("xyz", "New folder")).toBeNull();
    expect(fuzzyMatch("lf", "folder")).toBeNull();
  });

  it("returns the positions of the matched letters", () => {
    expect(fuzzyMatch("nf", "New folder")?.indices).toEqual([0, 4]);
  });

  it("ignores case and accents", () => {
    expect(fuzzyMatch("CAFE", "Café menu")?.indices).toEqual([0, 1, 2, 3]);
  });

  it("ignores spaces typed in the query", () => {
    expect(fuzzyMatch("new f", "New folder")).not.toBeNull();
  });

  it("matches everything with an empty query", () => {
    expect(fuzzyMatch("", "anything")).toEqual({ score: 0, indices: [] });
  });

  it("prefers consecutive letters over scattered ones", () => {
    const consecutive = fuzzyMatch("abc", "xabc")!;
    const scattered = fuzzyMatch("abc", "xaxbxc")!;

    expect(consecutive.score).toBeGreaterThan(scattered.score);
  });

  it("prefers matches at the start of words and at the start of the text", () => {
    const wordStarts = fuzzyMatch("ss", "Sort by size")!;
    const middle = fuzzyMatch("ss", "Mission statement")!;

    expect(wordStarts.score).toBeGreaterThan(middle.score);
  });

  it("picks the best alignment instead of the first one", () => {
    expect(fuzzyMatch("ab", "a xx ab")?.indices).toEqual([5, 6]);
  });

  it("treats camel case humps as word starts", () => {
    expect(fuzzyMatch("sh", "showHidden")?.indices).toEqual([0, 4]);
  });

  it("prefers shorter titles when everything else is equal", () => {
    expect(fuzzyMatch("new", "New")!.score).toBeGreaterThan(fuzzyMatch("new", "New and something long")!.score);
  });
});
