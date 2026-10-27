import { describe, expect, it } from "vitest";
import type { PaletteItem } from "../entities/palette-item";
import { PALETTE_RESULT_LIMIT, rankPaletteItems } from "./rank-palette-items";

function item(title: string, overrides: Partial<PaletteItem> = {}): PaletteItem {
  return { id: title, title, group: "commands", run: () => {}, ...overrides };
}

const titles = (items: PaletteItem[], query: string) => rankPaletteItems(items, query).map((ranked) => ranked.item.title);

describe("rankPaletteItems", () => {
  it("keeps the source order when there is no query and hides the typed-text entries", () => {
    const items = [item("Refresh"), item("Open settings"), item('Search for "x"', { group: "search", alwaysVisible: true })];

    expect(titles(items, "")).toEqual(["Refresh", "Open settings"]);
  });

  it("filters and sorts the commands by how well they match", () => {
    const items = [item("Rename"), item("New folder"), item("Show hidden files")];

    expect(titles(items, "nf")[0]).toBe("New folder");
    expect(titles(items, "nf")).not.toContain("Rename");
    expect(titles(items, "ren")[0]).toBe("Rename");
  });

  it("returns the matched letter positions for highlighting", () => {
    const [ranked] = rankPaletteItems([item("New folder")], "nf");

    expect(ranked.titleIndices).toEqual([0, 4]);
  });

  it("finds items through their keywords without highlighting the title", () => {
    const items = [item("Move to trash", { keywords: ["delete", "remove"] })];

    const [ranked] = rankPaletteItems(items, "delete");

    expect(ranked.item.title).toBe("Move to trash");
    expect(ranked.titleIndices).toEqual([]);
  });

  it("orders the groups: path, commands, places, search", () => {
    const items = [
      item("Search for docs", { group: "search", alwaysVisible: true }),
      item("Documents", { group: "places" }),
      item("Do something", { group: "commands" }),
      item("Go to /docs", { group: "go-to-path", alwaysVisible: true }),
    ];

    expect(titles(items, "do")).toEqual(["Go to /docs", "Do something", "Documents", "Search for docs"]);
  });

  it("always shows typed-text entries even when they do not match the query", () => {
    const items = [item("Go to ~/Pictures", { group: "go-to-path", alwaysVisible: true })];

    expect(titles(items, "~/Pictures")).toEqual(["Go to ~/Pictures"]);
  });

  it("keeps ties in their original order", () => {
    expect(titles([item("Back"), item("Backup")], "back")).toEqual(["Back", "Backup"]);
  });

  it("caps the number of results", () => {
    const many = Array.from({ length: 200 }, (_, index) => item(`Item ${index}`));

    expect(rankPaletteItems(many, "item")).toHaveLength(PALETTE_RESULT_LIMIT);
    expect(rankPaletteItems(many, "")).toHaveLength(PALETTE_RESULT_LIMIT);
  });
});
