import { afterEach, describe, expect, it, vi } from "vitest";
import { findDropTargetAt, highlightDropTarget, lastPathSegment } from "./drop-targets";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("drop targets", () => {
  it("finds the closest ancestor that declares a drop path", () => {
    document.body.innerHTML = '<div data-drop-path="/docs"><span id="inner">x</span></div>';
    document.elementFromPoint = vi.fn(() => document.getElementById("inner"));

    expect(findDropTargetAt(10, 10)).toBe("/docs");
  });

  it("returns null over elements that are not drop targets", () => {
    document.body.innerHTML = '<div id="plain"></div>';
    document.elementFromPoint = vi.fn(() => document.getElementById("plain"));

    expect(findDropTargetAt(10, 10)).toBeNull();
  });

  it("highlights only the targets for the given path and clears previous highlights", () => {
    document.body.innerHTML =
      '<div id="a" data-drop-path="/a"></div><div id="b" data-drop-path="/b"></div>';

    highlightDropTarget("/a");
    expect(document.getElementById("a")?.getAttribute("data-drop-hover")).toBe("true");

    highlightDropTarget("/b");
    expect(document.getElementById("a")?.hasAttribute("data-drop-hover")).toBe(false);
    expect(document.getElementById("b")?.getAttribute("data-drop-hover")).toBe("true");

    highlightDropTarget(null);
    expect(document.querySelectorAll("[data-drop-hover]").length).toBe(0);
  });
});

describe("lastPathSegment", () => {
  it("returns the last segment of posix and windows paths", () => {
    expect(lastPathSegment("/home/user/docs")).toBe("docs");
    expect(lastPathSegment("C:\\Users\\me")).toBe("me");
  });
});
