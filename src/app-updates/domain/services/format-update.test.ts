import { describe, expect, it } from "vitest";
import { describeUpdateError, downloadPercent, formatReleaseDate } from "./format-update";

describe("downloadPercent", () => {
  it("computes the percentage when the total is known", () => {
    expect(downloadPercent({ downloadedBytes: 25, totalBytes: 100 })).toBe(25);
    expect(downloadPercent({ downloadedBytes: 500, totalBytes: 100 })).toBe(100);
  });

  it("is unknown without progress or without a total size", () => {
    expect(downloadPercent(null)).toBeNull();
    expect(downloadPercent({ downloadedBytes: 10, totalBytes: null })).toBeNull();
    expect(downloadPercent({ downloadedBytes: 10, totalBytes: 0 })).toBeNull();
  });
});

describe("describeUpdateError", () => {
  it("explains the errors a user can act on", () => {
    expect(describeUpdateError({ kind: "network", message: "x" })).toContain("connection");
    expect(describeUpdateError({ kind: "invalidSignature", message: "x" })).toContain("discarded");
    expect(describeUpdateError({ kind: "notSupported", message: "x" })).toContain("release page");
  });

  it("falls back to the technical message for unexpected errors", () => {
    expect(describeUpdateError({ kind: "unexpected", message: "Boom" })).toBe("Boom");
  });
});

describe("formatReleaseDate", () => {
  it("formats known dates and ignores unknown ones", () => {
    expect(formatReleaseDate(Date.UTC(2026, 0, 15, 12))).toContain("2026");
    expect(formatReleaseDate(null)).toBeNull();
  });
});
