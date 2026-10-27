import { describe, expect, it } from "vitest";
import type { Workspace } from "../entities/workspace";
import {
  activatePane,
  activateTab,
  activateTabAtPosition,
  addTab,
  closeOtherTabs,
  closeTab,
  createWorkspace,
  cycleTab,
  moveTabToPane,
  reorderTab,
  setSplitRatio,
  splitWorkspace,
  unsplitWorkspace,
} from "./workspace-operations";

const tab = (id: string) => ({ id, sessionId: `s-${id}` });

function layout(workspace: Workspace) {
  return workspace.panes.map((pane) => `${pane.id}:${pane.tabs.map((t) => t.id).join(",")}|${pane.activeTabId}`);
}

function twoPanes(): Workspace {
  let workspace = createWorkspace("p1", tab("a"));
  workspace = addTab(workspace, "p1", tab("b"));
  workspace = splitWorkspace(workspace, "p2", tab("c"));
  return addTab(workspace, "p2", tab("d"));
}

describe("workspace operations", () => {
  it("adds a tab after the active one and activates it", () => {
    let workspace = createWorkspace("p1", tab("a"));
    workspace = addTab(workspace, "p1", tab("b"));
    workspace = activateTab(workspace, "a");
    workspace = addTab(workspace, "p1", tab("c"));

    expect(layout(workspace)).toEqual(["p1:a,c,b|c"]);
  });

  it("ignores adding to an unknown pane", () => {
    const workspace = createWorkspace("p1", tab("a"));

    expect(addTab(workspace, "nope", tab("b"))).toBe(workspace);
  });

  it("activating a tab also activates its pane", () => {
    const workspace = activateTab(twoPanes(), "a");

    expect(workspace.activePaneId).toBe("p1");
    expect(layout(workspace)[0]).toBe("p1:a,b|a");
  });

  it("activates a pane only when it exists", () => {
    const workspace = twoPanes();

    expect(activatePane(workspace, "p1").activePaneId).toBe("p1");
    expect(activatePane(workspace, "nope")).toBe(workspace);
  });

  describe("closeTab", () => {
    it("activates the next tab, or the previous one when closing the last", () => {
      let workspace = createWorkspace("p1", tab("a"));
      workspace = addTab(workspace, "p1", tab("b"));
      workspace = addTab(workspace, "p1", tab("c"));
      workspace = activateTab(workspace, "b");

      expect(layout(closeTab(workspace, "b"))).toEqual(["p1:a,c|c"]);
      expect(layout(closeTab(activateTab(workspace, "c"), "c"))).toEqual(["p1:a,b|b"]);
    });

    it("keeps the active tab when closing another one", () => {
      let workspace = createWorkspace("p1", tab("a"));
      workspace = addTab(workspace, "p1", tab("b"));

      expect(layout(closeTab(workspace, "a"))).toEqual(["p1:b|b"]);
    });

    it("keeps the last tab of the only pane", () => {
      const workspace = createWorkspace("p1", tab("a"));

      expect(closeTab(workspace, "a")).toBe(workspace);
    });

    it("removes a pane when its last tab closes and activates the remaining one", () => {
      let workspace = splitWorkspace(createWorkspace("p1", tab("a")), "p2", tab("c"));
      workspace = closeTab(workspace, "c");

      expect(layout(workspace)).toEqual(["p1:a|a"]);
      expect(workspace.activePaneId).toBe("p1");
    });

    it("keeps the active pane when another pane closes", () => {
      let workspace = splitWorkspace(createWorkspace("p1", tab("a")), "p2", tab("c"));
      workspace = activatePane(workspace, "p1");

      expect(closeTab(workspace, "c").activePaneId).toBe("p1");
    });

    it("ignores unknown tabs", () => {
      const workspace = createWorkspace("p1", tab("a"));

      expect(closeTab(workspace, "nope")).toBe(workspace);
    });
  });

  it("closes the other tabs of the pane only", () => {
    const workspace = closeOtherTabs(twoPanes(), "a");

    expect(layout(workspace)).toEqual(["p1:a|a", "p2:c,d|d"]);
    expect(workspace.activePaneId).toBe("p1");
  });

  describe("cycleTab", () => {
    it("wraps around in both directions inside the active pane", () => {
      let workspace = createWorkspace("p1", tab("a"));
      workspace = addTab(workspace, "p1", tab("b"));

      expect(cycleTab(workspace, 1).panes[0].activeTabId).toBe("a");
      expect(cycleTab(cycleTab(workspace, 1), -1).panes[0].activeTabId).toBe("b");
    });

    it("does nothing with a single tab", () => {
      const workspace = createWorkspace("p1", tab("a"));

      expect(cycleTab(workspace, 1)).toBe(workspace);
    });
  });

  describe("activateTabAtPosition", () => {
    it("jumps to a position, and 9 selects the last tab", () => {
      let workspace = createWorkspace("p1", tab("a"));
      workspace = addTab(workspace, "p1", tab("b"));
      workspace = addTab(workspace, "p1", tab("c"));

      expect(activateTabAtPosition(workspace, 1).panes[0].activeTabId).toBe("a");
      expect(activateTabAtPosition(workspace, 9).panes[0].activeTabId).toBe("c");
    });

    it("ignores positions beyond the tabs", () => {
      const workspace = createWorkspace("p1", tab("a"));

      expect(activateTabAtPosition(workspace, 5)).toBe(workspace);
    });
  });

  describe("reorderTab", () => {
    it("moves a tab to a new index", () => {
      expect(layout(reorderTab(twoPanes(), "a", 1))[0]).toBe("p1:b,a|b");
    });

    it("clamps the index and ignores no-op moves", () => {
      const workspace = twoPanes();

      expect(layout(reorderTab(workspace, "a", 99))[0]).toBe("p1:b,a|b");
      expect(reorderTab(workspace, "a", 0)).toBe(workspace);
      expect(reorderTab(workspace, "nope", 0)).toBe(workspace);
    });
  });

  describe("moveTabToPane", () => {
    it("moves the tab after the target's active tab and activates it", () => {
      const workspace = moveTabToPane(twoPanes(), "a", "p2");

      expect(layout(workspace)).toEqual(["p1:b|b", "p2:c,d,a|a"]);
      expect(workspace.activePaneId).toBe("p2");
    });

    it("removes the source pane when it becomes empty", () => {
      let workspace = splitWorkspace(createWorkspace("p1", tab("a")), "p2", tab("c"));
      workspace = moveTabToPane(workspace, "a", "p2");

      expect(layout(workspace)).toEqual(["p2:c,a|a"]);
      expect(workspace.activePaneId).toBe("p2");
    });

    it("ignores moves inside the same pane or to unknown panes", () => {
      const workspace = twoPanes();

      expect(moveTabToPane(workspace, "a", "p1")).toBe(workspace);
      expect(moveTabToPane(workspace, "a", "nope")).toBe(workspace);
    });
  });

  describe("split", () => {
    it("opens a second pane with the given tab and activates it", () => {
      const workspace = splitWorkspace(createWorkspace("p1", tab("a")), "p2", tab("b"));

      expect(layout(workspace)).toEqual(["p1:a|a", "p2:b|b"]);
      expect(workspace.activePaneId).toBe("p2");
    });

    it("does not open a third pane", () => {
      const workspace = twoPanes();

      expect(splitWorkspace(workspace, "p3", tab("x"))).toBe(workspace);
    });

    it("merges the tabs back keeping the active tab of the active pane", () => {
      const workspace = unsplitWorkspace(activateTab(twoPanes(), "c"));

      expect(layout(workspace)).toEqual(["p1:a,b,c,d|c"]);
      expect(workspace.activePaneId).toBe("p1");
    });

    it("does nothing to unsplit a single pane", () => {
      const workspace = createWorkspace("p1", tab("a"));

      expect(unsplitWorkspace(workspace)).toBe(workspace);
    });
  });

  it("clamps the split ratio", () => {
    const workspace = twoPanes();

    expect(setSplitRatio(workspace, 0.05).splitRatio).toBe(0.2);
    expect(setSplitRatio(workspace, 0.95).splitRatio).toBe(0.8);
    expect(setSplitRatio(workspace, 0.35).splitRatio).toBe(0.35);
    expect(setSplitRatio(workspace, 0.5)).toBe(workspace);
  });
});
