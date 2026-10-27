import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { createWorkspaceStore } from "../../application/stores/workspace-store";
import { WorkspaceProvider } from "../context/WorkspaceContext";
import { useWorkspaceShortcuts } from "./useWorkspaceShortcuts";

function setup(isBlocked = false) {
  let counter = 0;
  const store = createWorkspaceStore({
    createSession: () => ({ id: `s${++counter}` }),
    disposeSession: () => {},
    currentPathOf: () => "/home",
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <WorkspaceProvider store={store}>{children}</WorkspaceProvider>
  );
  renderHook(() => useWorkspaceShortcuts(isBlocked), { wrapper });
  return store;
}

function press(init: KeyboardEventInit) {
  const event = new KeyboardEvent("keydown", { cancelable: true, ...init });
  act(() => {
    window.dispatchEvent(event);
  });
  return event;
}

const sessionIds = (store: ReturnType<typeof setup>) =>
  store.getState().workspace.panes[0].tabs.map((tab) => tab.sessionId);

const activeSessionId = (store: ReturnType<typeof setup>) => {
  const pane = store.getState().workspace.panes[0];
  return pane.tabs.find((tab) => tab.id === pane.activeTabId)?.sessionId;
};

describe("useWorkspaceShortcuts", () => {
  it("opens a tab with Ctrl+T and closes the active one with Ctrl+W", () => {
    const store = setup();

    press({ key: "t", ctrlKey: true });
    expect(sessionIds(store)).toEqual(["s1", "s2"]);

    press({ key: "w", ctrlKey: true });
    expect(sessionIds(store)).toEqual(["s1"]);
  });

  it("cycles tabs with Ctrl+Tab, Ctrl+Shift+Tab and Ctrl+PageDown/PageUp", () => {
    const store = setup();
    press({ key: "t", ctrlKey: true });

    press({ key: "Tab", ctrlKey: true });
    expect(activeSessionId(store)).toBe("s1");
    press({ key: "Tab", ctrlKey: true, shiftKey: true });
    expect(activeSessionId(store)).toBe("s2");
    press({ key: "PageDown", ctrlKey: true });
    expect(activeSessionId(store)).toBe("s1");
    press({ key: "PageUp", ctrlKey: true });
    expect(activeSessionId(store)).toBe("s2");
  });

  it("jumps to a tab with Ctrl and a digit", () => {
    const store = setup();
    press({ key: "t", ctrlKey: true });

    press({ key: "1", ctrlKey: true });

    expect(activeSessionId(store)).toBe("s1");
  });

  it("prevents the default action of the keys it handles only", () => {
    setup();

    expect(press({ key: "t", ctrlKey: true }).defaultPrevented).toBe(true);
    expect(press({ key: "t" }).defaultPrevented).toBe(false);
    expect(press({ key: "q", ctrlKey: true }).defaultPrevented).toBe(false);
  });

  it("does nothing while blocked", () => {
    const store = setup(true);

    press({ key: "t", ctrlKey: true });

    expect(sessionIds(store)).toEqual(["s1"]);
  });
});
