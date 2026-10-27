import { describe, expect, it } from "vitest";
import type { Workspace } from "../entities/workspace";
import { layoutOf, parseWorkspaceLayout } from "./workspace-layout";

const workspace: Workspace = {
  panes: [
    { id: "p1", tabs: [{ id: "t1", sessionId: "s1" }, { id: "t2", sessionId: "s2" }], activeTabId: "t2" },
    { id: "p2", tabs: [{ id: "t3", sessionId: "s3" }], activeTabId: "t3" },
  ],
  activePaneId: "p2",
  splitRatio: 0.4,
};

const paths: Record<string, string> = { s1: "/a", s2: "/b", s3: "/c" };

describe("layoutOf", () => {
  it("records the folder of every tab, the active tab and pane and the ratio", () => {
    expect(layoutOf(workspace, (sessionId) => paths[sessionId])).toEqual({
      panes: [
        { paths: ["/a", "/b"], activeIndex: 1 },
        { paths: ["/c"], activeIndex: 0 },
      ],
      activePaneIndex: 1,
      splitRatio: 0.4,
    });
  });

  it("leaves out tabs whose folder is not known yet and panes left empty", () => {
    const layout = layoutOf(workspace, (sessionId) => (sessionId === "s1" ? "/a" : undefined));

    expect(layout).toEqual({ panes: [{ paths: ["/a"], activeIndex: 0 }], activePaneIndex: 0, splitRatio: 0.4 });
  });

  it("returns null when nothing is known", () => {
    expect(layoutOf(workspace, () => undefined)).toBeNull();
  });
});

describe("parseWorkspaceLayout", () => {
  it("accepts a valid layout", () => {
    const layout = { panes: [{ paths: ["/a", "/b"], activeIndex: 1 }], activePaneIndex: 0, splitRatio: 0.3 };

    expect(parseWorkspaceLayout(layout)).toEqual(layout);
  });

  it.each([
    ["null", null],
    ["a string", "layout"],
    ["no panes", { panes: [], activePaneIndex: 0, splitRatio: 0.5 }],
    ["panes that are not a list", { panes: "x" }],
    ["a pane without paths", { panes: [{ paths: [], activeIndex: 0 }] }],
    ["a pane that is not an object", { panes: [null] }],
    ["a pane whose paths are not strings", { panes: [{ paths: [1, 2], activeIndex: 0 }] }],
  ])("rejects %s", (_name, value) => {
    expect(parseWorkspaceLayout(value)).toBeNull();
  });

  it("repairs out-of-range numbers and ignores invalid paths and extra panes", () => {
    const parsed = parseWorkspaceLayout({
      panes: [
        { paths: ["/a", 5, "", "/b"], activeIndex: 99 },
        { paths: ["/c"], activeIndex: -3 },
        { paths: ["/d"], activeIndex: 0 },
      ],
      activePaneIndex: 7,
      splitRatio: 5,
    });

    expect(parsed).toEqual({
      panes: [
        { paths: ["/a", "/b"], activeIndex: 1 },
        { paths: ["/c"], activeIndex: 0 },
      ],
      activePaneIndex: 1,
      splitRatio: 0.8,
    });
  });

  it("falls back to an even split when the ratio is missing", () => {
    expect(parseWorkspaceLayout({ panes: [{ paths: ["/a"], activeIndex: 0 }] })?.splitRatio).toBe(0.5);
  });
});
