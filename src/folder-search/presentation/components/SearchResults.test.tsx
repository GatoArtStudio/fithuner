import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { match, renderWithSearch } from "./test-support";
import { SearchResults } from "./SearchResults";

vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getTotalSize: () => count * 38,
    getVirtualItems: () => Array.from({ length: count }, (_, index) => ({ index, start: index * 38 })),
    scrollToIndex: vi.fn(),
  }),
}));

const matches = [match("Report 2024.pdf"), match("report-final.docx", { relativeFolder: "docs/q1" }), match("photos", { kind: "directory" })];

function renderResults(text = "report") {
  const handlers = { onOpenMatch: vi.fn(), onShowInFolder: vi.fn(), onQuickLook: vi.fn() };
  const rendered = renderWithSearch(<SearchResults {...handlers} />, { matches, text });
  return { ...rendered, ...handlers, list: screen.getByRole("listbox", { name: "Search results" }) };
}

describe("SearchResults", () => {
  it("lists the matches with their folder and highlights what matched", () => {
    renderResults();

    expect(screen.getAllByRole("option")).toHaveLength(3);
    expect(screen.getByText("docs/q1")).toBeTruthy();
    expect(screen.getAllByText("Report", { selector: "mark" }).length).toBeGreaterThan(0);
  });

  it("marks the selected result and selects another one on click", () => {
    const { store } = renderResults();

    fireEvent.click(screen.getAllByRole("option")[1]);

    expect(store.getState().selectedPath).toBe("/home/docs/report-final.docx");
    expect(screen.getAllByRole("option")[1].getAttribute("aria-selected")).toBe("true");
  });

  it("opens a result with double click and with Enter", () => {
    const { onOpenMatch, list } = renderResults();

    fireEvent.doubleClick(screen.getAllByRole("option")[2]);
    fireEvent.keyDown(list, { key: "Enter" });

    expect(onOpenMatch).toHaveBeenNthCalledWith(1, matches[2]);
    expect(onOpenMatch).toHaveBeenNthCalledWith(2, matches[0]);
  });

  it("shows the result in its folder with Ctrl+Enter", () => {
    const { onShowInFolder, list } = renderResults();

    fireEvent.keyDown(list, { key: "Enter", ctrlKey: true });

    expect(onShowInFolder).toHaveBeenCalledWith(matches[0]);
  });

  it("moves the selection with the arrow keys, Home and End", () => {
    const { store, list } = renderResults();

    fireEvent.keyDown(list, { key: "ArrowDown" });
    expect(store.getState().selectedPath).toBe(matches[1].path);
    fireEvent.keyDown(list, { key: "End" });
    expect(store.getState().selectedPath).toBe(matches[2].path);
    fireEvent.keyDown(list, { key: "Home" });
    expect(store.getState().selectedPath).toBe(matches[0].path);
  });

  it("opens Quick Look with Space and closes the search with Escape", () => {
    const { onQuickLook, store, list } = renderResults();

    fireEvent.keyDown(list, { key: " " });
    fireEvent.keyDown(list, { key: "Escape" });

    expect(onQuickLook).toHaveBeenCalledWith(matches[0]);
    expect(store.getState().isOpen).toBe(false);
  });

  it("says when nothing was found", () => {
    renderWithSearch(<SearchResults onOpenMatch={vi.fn()} onShowInFolder={vi.fn()} />, { text: "zzz" });

    expect(screen.getByText("Nothing found")).toBeTruthy();
  });
});
