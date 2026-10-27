import { describe, expect, it } from "vitest";
import { renderMarkdown } from "./render-markdown";

describe("renderMarkdown", () => {
  it("renders common Markdown", () => {
    const html = renderMarkdown("# Title\n\n- one\n- **two**\n\n`code`");

    expect(html).toContain("<h1");
    expect(html).toContain("<li>one</li>");
    expect(html).toContain("<strong>two</strong>");
    expect(html).toContain("<code>code</code>");
  });

  it("renders tables from GitHub flavored Markdown", () => {
    expect(renderMarkdown("| a | b |\n|---|---|\n| 1 | 2 |")).toContain("<table>");
  });

  it("removes scripts, inline handlers and javascript links", () => {
    const html = renderMarkdown(
      '<script>alert(1)</script>\n\n<img src="x" onerror="alert(2)">\n\n[click](javascript:alert(3))',
    );

    expect(html).not.toContain("<script");
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("javascript:");
  });

  it("drops iframes and forms", () => {
    const html = renderMarkdown('<iframe src="https://evil.example"></iframe><form action="/x"><input></form>');

    expect(html).not.toContain("<iframe");
    expect(html).not.toContain("<form");
  });
});
