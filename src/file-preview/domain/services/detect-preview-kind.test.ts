import { describe, expect, it } from "vitest";
import { detectPreviewKind } from "./detect-preview-kind";

const file = (name: string) => ({ name, kind: "file" as const });

describe("detectPreviewKind", () => {
  it.each([
    ["photo.PNG", "image"],
    ["logo.svg", "image"],
    ["song.mp3", "audio"],
    ["clip.mp4", "video"],
    ["README.md", "markdown"],
    ["data.json", "json"],
    ["table.csv", "csv"],
    ["table.tsv", "csv"],
    ["manual.pdf", "pdf"],
    ["main.rs", "text"],
    ["Dockerfile", "text"],
    [".gitignore", "text"],
    ["notes", "text"],
    ["archive.zip", "unsupported"],
    ["report.docx", "unsupported"],
    ["font.woff2", "unsupported"],
  ])("classifies %s as %s", (name, expected) => {
    expect(detectPreviewKind(file(name))).toBe(expected);
  });

  it("treats directories as folders whatever their name", () => {
    expect(detectPreviewKind({ name: "photos.zip", kind: "directory" })).toBe("folder");
  });

  it("tries unknown extensions as text so the backend can decide", () => {
    expect(detectPreviewKind(file("weird.xyz123"))).toBe("text");
  });
});
