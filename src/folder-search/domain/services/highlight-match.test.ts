import { describe, expect, it } from "vitest";
import { highlightSegments } from "./highlight-match";
import { normalizeForSearch } from "./normalize-for-search";

describe("normalizeForSearch", () => {
  it("removes accents and ignores case", () => {
    expect(normalizeForSearch("Canción ÁRBOL")).toBe("cancion arbol");
  });
});

describe("highlightSegments", () => {
  it("marks the part of the name that matched", () => {
    expect(highlightSegments("Report 2024.pdf", "port")).toEqual([
      { text: "Re", isMatch: false },
      { text: "port", isMatch: true },
      { text: " 2024.pdf", isMatch: false },
    ]);
  });

  it("highlights accented letters when the query has none", () => {
    expect(highlightSegments("Café menu", "cafe")).toEqual([
      { text: "Café", isMatch: true },
      { text: " menu", isMatch: false },
    ]);
  });

  it("highlights every word of the query wherever it appears", () => {
    const segments = highlightSegments("Report 2024.pdf", "2024 rep");

    expect(segments.filter((segment) => segment.isMatch).map((segment) => segment.text)).toEqual(["Rep", "2024"]);
  });

  it("merges overlapping matches into one segment", () => {
    expect(highlightSegments("abcdef", "abc cde")).toEqual([
      { text: "abcde", isMatch: true },
      { text: "f", isMatch: false },
    ]);
  });

  it("returns the whole name when nothing matches or the query is blank", () => {
    expect(highlightSegments("holiday.jpg", "invoice")).toEqual([{ text: "holiday.jpg", isMatch: false }]);
    expect(highlightSegments("holiday.jpg", "  ")).toEqual([{ text: "holiday.jpg", isMatch: false }]);
  });

  it("keeps emoji and other multi-unit characters intact and aligned with the match", () => {
    const segments = highlightSegments("📁 notes", "notes");

    expect(segments.map((segment) => segment.text).join("")).toBe("📁 notes");
    expect(segments).toEqual([
      { text: "📁 ", isMatch: false },
      { text: "notes", isMatch: true },
    ]);
  });
});
