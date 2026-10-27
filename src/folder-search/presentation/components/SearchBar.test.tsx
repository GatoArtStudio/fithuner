import { act, fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SearchBar } from "./SearchBar";
import { renderWithSearch } from "./test-support";

function renderBar() {
  const handlers = { onFocusResults: vi.fn(), onOpenSelected: vi.fn() };
  const rendered = renderWithSearch(<SearchBar folderName="Documents" {...handlers} />);
  return { ...rendered, ...handlers };
}

describe("SearchBar", () => {
  it("focuses the input and names the folder being searched", () => {
    renderBar();

    const input = screen.getByRole("searchbox", { name: "Search" });
    expect(document.activeElement).toBe(input);
    expect(input.getAttribute("placeholder")).toBe("Search in Documents");
  });

  it("sends typed text to the store", () => {
    const { store } = renderBar();

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "report" } });

    expect(store.getState().text).toBe("report");
  });

  it("changes the type filter and the hidden files switch", () => {
    const { store } = renderBar();

    fireEvent.change(screen.getByLabelText("Type of item"), { target: { value: "images" } });
    fireEvent.click(screen.getByRole("button", { name: "Hidden" }));

    expect(store.getState().kindFilter).toBe("images");
    expect(store.getState().includeHidden).toBe(true);
    expect(screen.getByRole("button", { name: "Hidden" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("closes with Escape and with the close button", () => {
    const { store } = renderBar();

    fireEvent.keyDown(screen.getByRole("searchbox"), { key: "Escape" });
    expect(store.getState().isOpen).toBe(false);

    store.setState({ isOpen: true });
    fireEvent.click(screen.getByRole("button", { name: "Close search" }));
    expect(store.getState().isOpen).toBe(false);
  });

  it("hands over to the results with ArrowDown and opens the selection with Enter", () => {
    const { onFocusResults, onOpenSelected } = renderBar();
    const input = screen.getByRole("searchbox");

    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onFocusResults).toHaveBeenCalledOnce();
    expect(onOpenSelected).toHaveBeenCalledOnce();
  });

  it("announces the progress of the search", () => {
    const { store } = renderBar();

    act(() => store.setState({ status: { type: "searching" } }));

    expect(screen.getByRole("status").textContent).toContain("Searching");
  });
});
