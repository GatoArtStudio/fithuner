import { describe, expect, it } from "vitest";
import { languageForFile } from "./language-for-file";

describe("languageForFile", () => {
  it("maps extensions and special file names to highlight.js languages", () => {
    expect(languageForFile("main.rs")).toBe("rust");
    expect(languageForFile("App.tsx")).toBe("typescript");
    expect(languageForFile("Dockerfile")).toBe("dockerfile");
  });

  it("returns null for plain text", () => {
    expect(languageForFile("notes.txt")).toBeNull();
    expect(languageForFile("LICENSE")).toBeNull();
  });
});
