import { describe, expect, it } from "vitest";
import { describeSearchStatus } from "./describe-search-status";

const summary = { totalMatches: 3, scannedEntries: 10, isTruncated: false, wasCancelled: false };

describe("describeSearchStatus", () => {
  it("explains what to do when idle", () => {
    expect(describeSearchStatus({ type: "idle" }, 0)).toContain("Type to search");
  });

  it("shows the running count with the right plural", () => {
    expect(describeSearchStatus({ type: "searching" }, 1)).toBe("Searching… 1 result");
    expect(describeSearchStatus({ type: "searching" }, 1204)).toBe("Searching… 1,204 results");
  });

  it("summarizes a finished search", () => {
    expect(describeSearchStatus({ type: "done", summary }, 3)).toBe("3 results");
    expect(describeSearchStatus({ type: "done", summary }, 0)).toBe("No results");
  });

  it("says when the results were cut at the limit", () => {
    expect(describeSearchStatus({ type: "done", summary: { ...summary, isTruncated: true } }, 10000)).toBe(
      "10,000+ results (showing the first 10,000)",
    );
  });

  it("shows the error message", () => {
    expect(describeSearchStatus({ type: "error", error: { kind: "notFound", message: "Gone" } }, 0)).toBe("Gone");
  });
});
