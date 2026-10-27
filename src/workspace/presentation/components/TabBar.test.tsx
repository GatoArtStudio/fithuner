import { act, fireEvent, render, screen } from "@testing-library/react";
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
