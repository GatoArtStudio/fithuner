import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { createSearchStore } from "../../application/stores/search-store";
import { SearchProvider } from "../context/SearchContext";
import { useSearchShortcuts } from "./useSearchShortcuts";

function setup(isBlocked = false) {
  const store = createSearchStore({
    gateway: { startSearch: vi.fn(), cancelSearch: vi.fn(), subscribe: vi.fn() },
    currentDirectoryPath: () => "/home",
  });
  const wrapper = ({ children }: { children: ReactNode }) => <SearchProvider store={store}>{children}</SearchProvider>;
  renderHook(() => useSearchShortcuts(isBlocked), { wrapper });
  return store;
}

function press(init: KeyboardEventInit) {
  act(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { cancelable: true, ...init }));
  });
}

describe("useSearchShortcuts", () => {
  it("opens the search with Ctrl+F", () => {
    const store = setup();

    press({ key: "f", ctrlKey: true });

    expect(store.getState().isOpen).toBe(true);
  });

  it("ignores plain F and other modifiers", () => {
    const store = setup();

    press({ key: "f" });
    press({ key: "f", ctrlKey: true, shiftKey: true });
    press({ key: "f", ctrlKey: true, altKey: true });

    expect(store.getState().isOpen).toBe(false);
  });

  it("does nothing while blocked", () => {
    const store = setup(true);

    press({ key: "f", ctrlKey: true });

    expect(store.getState().isOpen).toBe(false);
  });
});
