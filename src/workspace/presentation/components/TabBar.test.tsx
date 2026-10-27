import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createWorkspaceStore } from "../../application/stores/workspace-store";
import { WorkspaceProvider } from "../context/WorkspaceContext";
import { TabBar } from "./TabBar";

function setup() {
  let counter = 0;
  const store = createWorkspaceStore({
    createSession: () => ({ id: `s${++counter}` }),
    disposeSession: () => {},
    currentPathOf: () => "/home",
  });
  const paneId = store.getState().workspace.panes[0].id;
  render(
    <WorkspaceProvider store={store}>
      <TabBar paneId={paneId} renderTitle={(tab) => `Title ${tab.sessionId}`} />
    </WorkspaceProvider>,
  );
  return { store, paneId };
}

const activeSessionId = (store: ReturnType<typeof setup>["store"]) => {
  const pane = store.getState().workspace.panes[0];
  return pane.tabs.find((tab) => tab.id === pane.activeTabId)?.sessionId;
};

describe("TabBar", () => {
  it("shows the tab titles and marks the active one", () => {
    const { store } = setup();
    act(() => store.getState().newTab());

    const tabs = screen.getAllByRole("tab");

    expect(tabs.map((tab) => tab.textContent)).toEqual(["Title s1", "Title s2"]);
    expect(tabs[1].getAttribute("aria-selected")).toBe("true");
  });

  it("does not offer to close the only tab", () => {
    setup();

    expect(screen.queryByRole("button", { name: "Close tab" })).toBeNull();
  });

  it("opens a new tab with the plus button", () => {
    const { store } = setup();

    fireEvent.click(screen.getByRole("button", { name: "New tab" }));

    expect(store.getState().workspace.panes[0].tabs).toHaveLength(2);
    expect(screen.getAllByRole("tab")).toHaveLength(2);
  });

  it("selects a tab by clicking it", () => {
    const { store } = setup();
    act(() => store.getState().newTab());

    fireEvent.click(screen.getAllByRole("tab")[0]);

    expect(activeSessionId(store)).toBe("s1");
  });

  it("closes a tab with its button without selecting it first", () => {
    const { store } = setup();
    act(() => store.getState().newTab());

    fireEvent.click(screen.getAllByRole("button", { name: "Close tab" })[0]);

    expect(store.getState().workspace.panes[0].tabs.map((tab) => tab.sessionId)).toEqual(["s2"]);
  });

  it("closes a tab with a middle click", () => {
    const { store } = setup();
    act(() => store.getState().newTab());

    fireEvent(screen.getAllByRole("tab")[1], new MouseEvent("auxclick", { bubbles: true, button: 1 }));

    expect(store.getState().workspace.panes[0].tabs.map((tab) => tab.sessionId)).toEqual(["s1"]);
  });

  it("selects a tab with the keyboard", () => {
    const { store } = setup();
    act(() => store.getState().newTab());

    fireEvent.keyDown(screen.getAllByRole("tab")[0], { key: "Enter" });

    expect(activeSessionId(store)).toBe("s1");
  });
});

describe("TabBar context menu and dragging", () => {
  const menuLabels = () => within(screen.getByRole("menu")).getAllByRole("menuitem").map((item) => item.textContent);

  it("offers duplicate, close and close others on a tab", () => {
    const { store } = setup();
    act(() => store.getState().newTab());

    fireEvent.contextMenu(screen.getAllByRole("tab")[0]);

    expect(menuLabels().map((label) => label?.replace(/Ctrl\+W/, ""))).toEqual([
      "Duplicate tab",
      "Close tab",
      "Close other tabs",
    ]);
  });

  it("only offers duplicate for the only tab", () => {
    setup();

    fireEvent.contextMenu(screen.getByRole("tab"));

    expect(menuLabels()).toEqual(["Duplicate tab"]);
  });

  it("duplicates the tab next to the original", () => {
    const { store } = setup();
    act(() => store.getState().newTab());
    fireEvent.contextMenu(screen.getAllByRole("tab")[0]);

    fireEvent.click(screen.getByRole("menuitem", { name: "Duplicate tab" }));

    expect(store.getState().workspace.panes[0].tabs.map((tab) => tab.sessionId)).toEqual(["s1", "s3", "s2"]);
  });

  it("closes the other tabs", () => {
    const { store } = setup();
    act(() => store.getState().newTab());
    fireEvent.contextMenu(screen.getAllByRole("tab")[0]);

    fireEvent.click(screen.getByRole("menuitem", { name: "Close other tabs" }));

    expect(store.getState().workspace.panes[0].tabs.map((tab) => tab.sessionId)).toEqual(["s1"]);
  });

  it("offers to move the tab to the other pane only when split", () => {
    const { store } = setup();
    act(() => store.getState().toggleSplit());

    fireEvent.contextMenu(screen.getAllByRole("tab")[0]);
    fireEvent.click(screen.getByRole("menuitem", { name: "Move to other pane" }));

    expect(store.getState().workspace.panes.map((pane) => pane.tabs.map((tab) => tab.sessionId))).toEqual([
      ["s2", "s1"],
    ]);
  });

  it("reorders a tab by dragging it past its neighbour", () => {
    const { store } = setup();
    act(() => store.getState().newTab());
    const tabs = screen.getAllByRole("tab");
    tabs.forEach((tab, index) => {
      tab.getBoundingClientRect = () =>
        ({ left: index * 100, width: 100, right: index * 100 + 100 }) as DOMRect;
    });

    fireEvent.pointerDown(tabs[0], { button: 0, clientX: 50 });
    fireEvent.pointerMove(tabs[0], { clientX: 180 });
    fireEvent.pointerUp(tabs[0], { clientX: 180 });

    expect(store.getState().workspace.panes[0].tabs.map((tab) => tab.sessionId)).toEqual(["s2", "s1"]);
  });

  it("does not reorder on a plain click", () => {
    const { store } = setup();
    act(() => store.getState().newTab());
    const tabs = screen.getAllByRole("tab");

    fireEvent.pointerDown(tabs[0], { button: 0, clientX: 50 });
    fireEvent.pointerMove(tabs[0], { clientX: 52 });
    fireEvent.pointerUp(tabs[0], { clientX: 52 });

    expect(store.getState().workspace.panes[0].tabs.map((tab) => tab.sessionId)).toEqual(["s1", "s2"]);
  });

  it("moves a tab to the other pane when dropped on its tab bar", () => {
    const { store } = setup();
    act(() => store.getState().newTab());
    act(() => store.getState().toggleSplit());
    const [firstPane] = store.getState().workspace.panes;
    const otherPaneId = store.getState().workspace.panes[1].id;
    const otherBar = document.createElement("div");
    otherBar.setAttribute("data-tab-bar-pane", otherPaneId);
    document.body.append(otherBar);
    document.elementFromPoint = () => otherBar;
    const tab = screen.getAllByRole("tab").find((element) => element.dataset.tabId === firstPane.tabs[0].id)!;

    fireEvent.pointerDown(tab, { button: 0, clientX: 10 });
    fireEvent.pointerMove(tab, { clientX: 300 });
    fireEvent.pointerUp(tab, { clientX: 300 });

    const [, second] = store.getState().workspace.panes;
    expect(second.tabs.map((candidate) => candidate.sessionId)).toContain("s1");
    otherBar.remove();
  });
});
