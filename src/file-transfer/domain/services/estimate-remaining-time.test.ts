import { describe, expect, it } from "vitest";
import { estimateRemainingSeconds, formatDuration, transferPercent } from "./estimate-remaining-time";

describe("transferPercent", () => {
  it("uses bytes when known and falls back to file counts", () => {
    expect(transferPercent(50, 200)).toBe(25);
    expect(transferPercent(0, 0, 1, 4)).toBe(25);
    expect(transferPercent(0, 0)).toBe(0);
  });

  it("never exceeds 100", () => {
    expect(transferPercent(300, 200)).toBe(100);
  });
});

describe("estimateRemainingSeconds", () => {
  it("extrapolates from the average speed", () => {
    expect(estimateRemainingSeconds(100, 400, 10_000)).toBe(30);
  });

  it("returns null when it cannot estimate", () => {
    expect(estimateRemainingSeconds(0, 400, 1000)).toBeNull();
    expect(estimateRemainingSeconds(400, 400, 1000)).toBeNull();
  });
});

describe("formatDuration", () => {
  it.each([
    [5, "5s"],
    [75, "1m 15s"],
    [3720, "1h 2m"],
  ])("formats %d seconds as %s", (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected);
  });
});
