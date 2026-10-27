import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { createCommandPaletteStore } from "../../application/stores/command-palette-store";
import { CommandPaletteProvider } from "../context/CommandPaletteContext";
import { useCommandPaletteShortcuts } from "./useCommandPaletteShortcuts";

function setup(isBlocked = false) {
  const store = createCommandPaletteStore({ getItems: () => [] });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <CommandPaletteProvider store={store}>{children}</CommandPaletteProvider>
  );
  renderHook(() => useCommandPaletteShortcuts(isBlocked), { wrapper });
  return store;
}

function press(init: KeyboardEventInit) {
  act(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { cancelable: true, ...init }));
  });
}

describe("useCommandPaletteShortcuts", () => {
  it("opens and closes with Ctrl+K", () => {
    const store = setup();

    press({ key: "k", ctrlKey: true });
    expect(store.getState().isOpen).toBe(true);

    press({ key: "k", ctrlKey: true });
    expect(store.getState().isOpen).toBe(false);
  });

  it("also opens with Ctrl+Shift+P", () => {
    const store = setup();

    press({ key: "P", ctrlKey: true, shiftKey: true });

    expect(store.getState().isOpen).toBe(true);
  });

  it("ignores other combinations", () => {
    const store = setup();

    press({ key: "k" });
    press({ key: "p", ctrlKey: true });
    press({ key: "k", ctrlKey: true, altKey: true });

    expect(store.getState().isOpen).toBe(false);
  });

  it("does nothing while blocked", () => {
    const store = setup(true);

    press({ key: "k", ctrlKey: true });

    expect(store.getState().isOpen).toBe(false);
  });
});
