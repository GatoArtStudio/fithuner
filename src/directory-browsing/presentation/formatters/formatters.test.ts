import { describe, expect, it } from "vitest";
import { formatFileSize, formatModifiedDate } from "./formatters";

describe("formatFileSize", () => {
  it.each([
    [0, "0 B"],
    [512, "512 B"],
    [1536, "1.5 KB"],
    [10 * 1024 * 1024, "10 MB"],
    [5 * 1024 ** 3, "5 GB"],
  ])("formats %d bytes as %s", (bytes, expected) => {
    expect(formatFileSize(bytes)).toBe(expected);
  });
});

describe("formatModifiedDate", () => {
  it("shows a dash when the date is unknown", () => {
    expect(formatModifiedDate(null)).toBe("—");
  });

  it("formats a known date", () => {
    expect(formatModifiedDate(Date.UTC(2026, 0, 15, 12, 0))).toContain("2026");
  });
});
