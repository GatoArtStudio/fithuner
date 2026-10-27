import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(async (command: string, args?: { path?: string }) => {
    if (command === "check_for_update") return { currentVersion: "0.1.0", available: null };
    if (command === "load_settings") {
      return {
        appearance: { theme: "system" },
        browsing: { showHiddenFiles: false, confirmBeforeTrash: false },
      };
    }
    if (command === "list_places") return [{ label: "Home", path: "/home/user", kind: "home" }];
    const path = args?.path ?? "/home/user";
    return { path, parentPath: "/home", entries: [] };
  }),
}));

vi.mock("@tauri-apps/api/event", () => ({ listen: vi.fn(async () => () => {}) }));

vi.mock("@tauri-apps/api/webview", () => ({
  getCurrentWebview: () => ({ onDragDropEvent: vi.fn(async () => () => {}) }),
}));

import { App } from "./App";

const panes = () => screen.queryAllByRole("region", { name: "Folder pane" });

describe("workspace view", () => {
  it("starts with one pane and one tab", async () => {
    render(<App />);

    expect(await screen.findAllByRole("tab")).toHaveLength(1);
    expect(panes()).toHaveLength(1);
    expect(screen.queryByRole("separator", { name: "Resize panes" })).toBeNull();
  });

  it("splits with Ctrl+\\ and merges the panes back", async () => {
    render(<App />);
    await screen.findAllByRole("tab");

    fireEvent.keyDown(window, { key: "\\", ctrlKey: true });

    expect(panes()).toHaveLength(2);
    expect(screen.getByRole("separator", { name: "Resize panes" })).toBeTruthy();
    expect(screen.getAllByRole("tablist")).toHaveLength(2);

    fireEvent.keyDown(window, { key: "\\", ctrlKey: true });

    expect(panes()).toHaveLength(1);
    expect(screen.getAllByRole("tab")).toHaveLength(2);
  });

  it("activates the pane the user interacts with and switches with F6", async () => {
    render(<App />);
    await screen.findAllByRole("tab");
    fireEvent.keyDown(window, { key: "\\", ctrlKey: true });
    const [first, second] = panes();
    expect(second.getAttribute("data-active")).toBe("true");

    fireEvent.mouseDown(within(first).getAllByRole("tab")[0]);
    expect(first.getAttribute("data-active")).toBe("true");
    expect(second.getAttribute("data-active")).toBe("false");

    fireEvent.keyDown(window, { key: "F6" });
    expect(second.getAttribute("data-active")).toBe("true");
  });

  it("opens tabs inside the active pane", async () => {
    render(<App />);
    await screen.findAllByRole("tab");
    fireEvent.keyDown(window, { key: "\\", ctrlKey: true });

    fireEvent.keyDown(window, { key: "t", ctrlKey: true });

    const [first, second] = panes();
    expect(within(first).getAllByRole("tab")).toHaveLength(1);
    expect(within(second).getAllByRole("tab")).toHaveLength(2);
  });

  it("resizes the panes with the divider keyboard and keeps the ratio within limits", async () => {
    render(<App />);
    await screen.findAllByRole("tab");
    fireEvent.keyDown(window, { key: "\\", ctrlKey: true });
    const divider = screen.getByRole("separator", { name: "Resize panes" });

    fireEvent.keyDown(divider, { key: "ArrowRight" });
    expect(divider.getAttribute("aria-valuenow")).toBe("52");

    for (let step = 0; step < 40; step++) fireEvent.keyDown(divider, { key: "ArrowLeft" });
    expect(divider.getAttribute("aria-valuenow")).toBe("20");
  });

  it("closes the split when the last tab of a pane closes", async () => {
    render(<App />);
    await screen.findAllByRole("tab");
    fireEvent.keyDown(window, { key: "\\", ctrlKey: true });

    act(() => {
      fireEvent.click(screen.getAllByRole("button", { name: "Close tab" })[1]);
    });

    expect(panes()).toHaveLength(1);
  });
});
