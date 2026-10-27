import { describe, expect, it } from "vitest";
import { describeMediaError } from "./describe-media-error";

describe("describeMediaError", () => {
  it("explains the standard media error codes", () => {
    expect(describeMediaError({ code: 4 })).toBe(
      "Playback failed: the format is not supported by the system's media backend",
    );
    expect(describeMediaError({ code: 3 })).toContain("could not be decoded");
  });

  it("appends the technical message from the engine when there is one", () => {
    expect(describeMediaError({ code: 4, message: "Failed to create pipeline" })).toContain("(Failed to create pipeline)");
  });

  it("copes with a missing error or an unknown code", () => {
    expect(describeMediaError(null)).toBe("The player reported an unknown error");
    expect(describeMediaError({ code: 99 })).toBe("Playback failed: unknown reason");
  });
});
