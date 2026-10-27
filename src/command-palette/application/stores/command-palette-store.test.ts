import { describe, expect, it, vi } from "vitest";
import type { PaletteItem } from "../../domain/entities/palette-item";
import { createCommandPaletteStore } from "./command-palette-store";

function setup() {
  const refresh = vi.fn();
  const settings = vi.fn();
  const getItems = vi.fn((query: string): PaletteItem[] => [
    { id: "refresh", title: "Refresh", group: "commands", run: refresh },
    { id: "settings", title: "Open settings", group: "commands", run: settings },
    { id: "search", title: `Search for "${query}"`, group: "search", alwaysVisible: true, run: vi.fn() },
  ]);
  return { store: createCommandPaletteStore({ getItems }), refresh, settings, getItems };
}

const titles = (store: ReturnType<typeof setup>["store"]) => store.getState().results.map((ranked) => ranked.item.title);

describe("command palette store", () => {
  it("opens with the commands listed and the first one selected", () => {
    const { store } = setup();

    store.getState().open();

    expect(store.getState()).toMatchObject({ isOpen: true, query: "", selectedIndex: 0 });
    expect(titles(store)).toEqual(["Refresh", "Open settings"]);
  });

  it("filters while typing and resets the selection", () => {
    const { store } = setup();
    store.getState().open();
    store.getState().moveSelection(1);

    store.getState().setQuery("set");

    expect(titles(store)).toEqual(["Open settings", 'Search for "set"']);
    expect(store.getState().selectedIndex).toBe(0);
  });

  it("asks for the items again with the current query", () => {
    const { store, getItems } = setup();

    store.getState().open();
    store.getState().setQuery("abc");

    expect(getItems).toHaveBeenLastCalledWith("abc");
  });

  it("wraps the selection around the list in both directions", () => {
    const { store } = setup();
    store.getState().open();

    store.getState().moveSelection(-1);
    expect(store.getState().selectedIndex).toBe(1);
    store.getState().moveSelection(1);
    expect(store.getState().selectedIndex).toBe(0);
  });

  it("runs the selected item and closes", () => {
    const { store, settings } = setup();
    store.getState().open();
    store.getState().moveSelection(1);

    store.getState().runSelected();

    expect(settings).toHaveBeenCalledOnce();
    expect(store.getState().isOpen).toBe(false);
  });

  it("does nothing when there is nothing to run", () => {
    const store = createCommandPaletteStore({ getItems: () => [] });
    store.getState().open();

    expect(() => store.getState().runSelected()).not.toThrow();
    expect(store.getState().isOpen).toBe(true);
  });

  it("clears the query and the results when closed", () => {
    const { store } = setup();
    store.getState().open();
    store.getState().setQuery("ref");

    store.getState().close();

    expect(store.getState()).toMatchObject({ isOpen: false, query: "", results: [] });
  });

  it("can run an item chosen with the mouse", () => {
    const { store, refresh } = setup();
    store.getState().open();

    store.getState().runItem(store.getState().results[0].item);

    expect(refresh).toHaveBeenCalledOnce();
    expect(store.getState().isOpen).toBe(false);
  });
});
