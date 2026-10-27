import { describe, expect, it } from "vitest";
import { languageForFile } from "../../domain/services/language-for-file";
import { highlightCode } from "./highlight-code";

describe("highlightCode", () => {
  it("wraps tokens in highlight classes and escapes the code", async () => {
    const html = await highlightCode('fn main() { let x = "<b>"; }', "rust");

    expect(html).toContain("hljs-keyword");
    expect(html).not.toContain("<b>");
    expect(html).toContain("&lt;b&gt;");
  });

  it("returns null for plain text and unknown languages", async () => {
    expect(await highlightCode("hello", null)).toBeNull();
    expect(await highlightCode("hello", "klingon")).toBeNull();
  });

  it("skips very large inputs", async () => {
    expect(await highlightCode("a".repeat(300_001), "rust")).toBeNull();
  });

  it("has a loader for every language the file mapping can return", async () => {
    const names = ["main.rs", "a.ts", "a.js", "a.py", "a.go", "a.java", "a.kt", "a.c", "a.cpp", "a.cs", "a.php", "a.rb", "a.sh", "a.ps1", "a.sql", "a.yaml", "a.toml", "a.xml", "a.css", "a.scss", "a.json", "a.lua", "a.swift", "a.dart", "Dockerfile", "Makefile"];

    for (const name of names) {
      const language = languageForFile(name);
      expect(language, name).not.toBeNull();
      expect(await highlightCode("x", language), name).not.toBeNull();
    }
  });
});
