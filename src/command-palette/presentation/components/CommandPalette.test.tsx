import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createCommandPaletteStore } from "../../application/stores/command-palette-store";
import type { PaletteItem } from "../../domain/entities/palette-item";
import { CommandPaletteProvider } from "../context/CommandPaletteContext";
import { CommandPalette } from "./CommandPalette";

function setup() {
  const run = { refresh: vi.fn(), settings: vi.fn(), search: vi.fn() };
  const store = createCommandPaletteStore({
    getItems: (query): PaletteItem[] => [
      { id: "refresh", title: "Refresh", shortcut: "F5", group: "commands", run: run.refresh },
      { id: "settings", title: "Open settings", shortcut: "Ctrl+,", group: "commands", run: run.settings },
      { id: "documents", title: "Documents", subtitle: "/home/ana/Documents", group: "places", run: vi.fn() },
      { id: "search", title: `Search for "${query}"`, group: "search", alwaysVisible: true, run: run.search },
    ],
  });
  render(
    <CommandPaletteProvider store={store}>
      <CommandPalette />
    </CommandPaletteProvider>,
  );
  act(() => store.getState().open());
  return { store, run, input: screen.getByRole("combobox", { name: "Command" }) };
}

describe("CommandPalette", () => {
  it("is hidden until it is opened and then focuses its input", () => {
    const { input } = setup();

    expect(screen.getByRole("dialog", { name: "Command palette" })).toBeTruthy();
    expect(document.activeElement).toBe(input);
  });

  it("lists the groups with shortcuts and subtitles", () => {
    setup();

    expect(screen.getByText("Commands")).toBeTruthy();
    expect(screen.getByText("Folders and places")).toBeTruthy();
    expect(screen.getByText("F5")).toBeTruthy();
    expect(screen.getByText("/home/ana/Documents")).toBeTruthy();
  });

  it("filters as the user types and highlights the matched letters", () => {
    const { input } = setup();

    fireEvent.change(input, { target: { value: "set" } });

    expect(screen.queryByText("Refresh")).toBeNull();
    const highlighted = Array.from(screen.getAllByRole("option")[0].querySelectorAll("mark")).map((mark) => mark.textContent);
    expect(highlighted.join("")).toBe("set");
    expect(screen.getByRole("option", { name: /Search for "set"/ })).toBeTruthy();
  });

  it("runs the selected command with Enter after moving with the arrows", () => {
    const { input, run, store } = setup();

    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(run.settings).toHaveBeenCalledOnce();
    expect(store.getState().isOpen).toBe(false);
  });

  it("marks the selected option for assistive technology", () => {
    const { input } = setup();

    fireEvent.keyDown(input, { key: "ArrowDown" });

    const options = screen.getAllByRole("option");
    expect(options[1].getAttribute("aria-selected")).toBe("true");
    expect(input.getAttribute("aria-activedescendant")).toBe(options[1].id);
  });

  it("runs an option when it is clicked", () => {
    const { run } = setup();

    fireEvent.click(screen.getByRole("option", { name: /Refresh/ }));

    expect(run.refresh).toHaveBeenCalledOnce();
  });

  it("closes with Escape and when the backdrop is clicked", () => {
    const { input, store } = setup();

    fireEvent.keyDown(input, { key: "Escape" });
    expect(store.getState().isOpen).toBe(false);

    act(() => store.getState().open());
    fireEvent.click(screen.getByRole("dialog").parentElement as HTMLElement);
    expect(store.getState().isOpen).toBe(false);
  });

  it("says when nothing matches", () => {
    const store = createCommandPaletteStore({ getItems: () => [] });
    render(
      <CommandPaletteProvider store={store}>
        <CommandPalette />
      </CommandPaletteProvider>,
    );
    act(() => store.getState().open());

    expect(screen.getByText("No matching commands")).toBeTruthy();
  });
});
