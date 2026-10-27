import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../../../settings/domain/entities/app-settings";
import type { PreviewTarget } from "../entities/preview";
import { decidePreview, limitInBytes } from "./decide-preview";

const MB = 1024 * 1024;

function target(name: string, sizeInBytes = 100, kind: "file" | "directory" = "file"): PreviewTarget {
  return { path: `/files/${name}`, name, kind, sizeInBytes, modifiedAtMillis: null };
}

const preview = DEFAULT_SETTINGS.preview;

describe("decidePreview", () => {
  it("renders supported files within their limits", () => {
    expect(decidePreview(target("photo.png", 2 * MB), preview)).toEqual({ type: "render", kind: "image" });
    expect(decidePreview(target("docs", 0, "directory"), preview)).toEqual({ type: "render", kind: "folder" });
  });

  it("reports unsupported formats", () => {
    expect(decidePreview(target("archive.zip"), preview)).toEqual({ type: "unsupported" });
  });

  it("reports a disabled provider with its kind", () => {
    const settings = {
      ...preview,
      providers: { ...preview.providers, video: { enabled: false } },
    };

    expect(decidePreview(target("clip.mp4"), settings)).toEqual({ type: "disabled", kind: "video" });
  });

  it("flags files over the limit and only allows forcing images and PDFs", () => {
    expect(decidePreview(target("huge.png", 30 * MB), preview)).toEqual({
      type: "too-large", kind: "image", limitBytes: 25 * MB, canForce: true,
    });
    expect(decidePreview(target("huge.json", 3 * MB), preview)).toEqual({
      type: "too-large", kind: "json", limitBytes: 2 * MB, canForce: false,
    });
  });

  it("never rejects text for its size because it is cut at the limit instead", () => {
    expect(decidePreview(target("big.log", 500 * MB), preview)).toEqual({ type: "render", kind: "text" });
  });

  it("respects a custom limit", () => {
    const settings = {
      ...preview,
      providers: { ...preview.providers, csv: { enabled: true, maxSizeMegabytes: 1 } },
    };

    expect(decidePreview(target("data.csv", 2 * MB), settings).type).toBe("too-large");
    expect(limitInBytes(settings.providers, "csv")).toBe(MB);
  });
});
