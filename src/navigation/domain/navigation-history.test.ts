import { describe, expect, it } from "vitest";
import {
  EMPTY_HISTORY,
  canGoBack,
  canGoForward,
  currentPath,
  stepBack,
  stepForward,
  visit,
} from "./navigation-history";

describe("navigation history", () => {
  it("starts empty", () => {
    expect(currentPath(EMPTY_HISTORY)).toBeNull();
    expect(canGoBack(EMPTY_HISTORY)).toBe(false);
    expect(canGoForward(EMPTY_HISTORY)).toBe(false);
  });

  it("moves back and forward through visited paths", () => {
    const history = visit(visit(visit(EMPTY_HISTORY, "/a"), "/b"), "/c");

    const back = stepBack(history);
    expect(currentPath(back)).toBe("/b");
    expect(canGoForward(back)).toBe(true);
    expect(currentPath(stepForward(back))).toBe("/c");
  });

  it("drops the forward entries when visiting a new path after going back", () => {
    const history = stepBack(visit(visit(EMPTY_HISTORY, "/a"), "/b"));

    const branched = visit(history, "/c");

    expect(branched.paths).toEqual(["/a", "/c"]);
    expect(canGoForward(branched)).toBe(false);
  });

  it("does not duplicate the current path", () => {
    const history = visit(EMPTY_HISTORY, "/a");

    expect(visit(history, "/a")).toBe(history);
  });

  it("stays put at the edges", () => {
    const history = visit(EMPTY_HISTORY, "/a");

    expect(stepBack(history)).toBe(history);
    expect(stepForward(history)).toBe(history);
  });
});
