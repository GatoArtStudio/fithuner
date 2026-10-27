import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PreviewTarget } from "../../../domain/entities/preview";
import { createFakeGateway, renderWithPreview } from "../test-support";
import { CsvPreview } from "./CsvPreview";
import { JsonPreview } from "./JsonPreview";
import MarkdownPreview from "./MarkdownPreview";
import { TextPreview } from "./TextPreview";

function target(name: string): PreviewTarget {
  return { path: `/files/${name}`, name, kind: "file", sizeInBytes: 100, modifiedAtMillis: null };
}

function gatewayReturning(content: string, extra: { isTruncated?: boolean; totalBytes?: number } = {}) {
  return createFakeGateway({
    readText: vi.fn().mockResolvedValue({
      content,
      isTruncated: extra.isTruncated ?? false,
      totalBytes: extra.totalBytes ?? content.length,
    }),
  });
}

const props = (name: string) => ({ target: target(name), variant: "panel" as const, onOpenExternally: vi.fn() });

describe("TextPreview", () => {
  it("shows the file content", async () => {
    await renderWithPreview(<TextPreview {...props("notes.txt")} />, { gateway: gatewayReturning("hello world") });

    expect(await screen.findByText("hello world")).toBeTruthy();
  });

  it("asks the backend for at most the configured size", async () => {
    const gateway = gatewayReturning("x");
    await renderWithPreview(<TextPreview {...props("notes.txt")} />, { gateway });

    await screen.findByText("x");

    expect(gateway.readText).toHaveBeenCalledWith("/files/notes.txt", 1024 * 1024);
  });

  it("warns when the file was cut", async () => {
    await renderWithPreview(<TextPreview {...props("big.log")} />, {
      gateway: gatewayReturning("start", { isTruncated: true, totalBytes: 5 * 1024 * 1024 }),
    });

    expect(await screen.findByText(/Showing the beginning of the file. The full file is 5 MB./)).toBeTruthy();
  });

  it("explains that binary files are not text", async () => {
    await renderWithPreview(<TextPreview {...props("blob.xyz")} />, {
      gateway: createFakeGateway({ readText: vi.fn().mockResolvedValue(null) }),
    });

    expect(await screen.findByText("This file does not look like text")).toBeTruthy();
  });

  it("shows the reason when the file cannot be read", async () => {
    await renderWithPreview(<TextPreview {...props("secret.txt")} />, {
      gateway: createFakeGateway({
        readText: vi.fn().mockRejectedValue({ kind: "permissionDenied", message: "Permission denied" }),
      }),
    });

    expect(await screen.findByText("This file cannot be previewed")).toBeTruthy();
    expect(screen.getByText("Permission denied")).toBeTruthy();
  });

  it("says when the file is empty", async () => {
    await renderWithPreview(<TextPreview {...props("empty.txt")} />, { gateway: gatewayReturning("") });

    expect(await screen.findByText("This file is empty.")).toBeTruthy();
  });
});

describe("MarkdownPreview", () => {
  it("renders Markdown and removes dangerous markup", async () => {
    await renderWithPreview(<MarkdownPreview {...props("README.md")} />, {
      gateway: gatewayReturning("# Title\n\n<script>alert(1)</script>\n\n**bold**"),
    });

    expect(await screen.findByRole("heading", { name: "Title" })).toBeTruthy();
    expect(screen.getByText("bold").tagName).toBe("STRONG");
    expect(document.querySelector("script")).toBeNull();
  });

  it("does not navigate when a link is clicked", async () => {
    await renderWithPreview(<MarkdownPreview {...props("README.md")} />, {
      gateway: gatewayReturning("[site](https://example.com)"),
    });

    const link = await screen.findByRole("link", { name: "site" });
    const clickEvent = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(clickEvent);

    expect(clickEvent.defaultPrevented).toBe(true);
  });
});

describe("JsonPreview", () => {
  it("shows a tree with keys and typed values", async () => {
    await renderWithPreview(<JsonPreview {...props("data.json")} />, {
      gateway: gatewayReturning('{"name":"Fithuner","tags":["a","b"],"active":true,"count":3,"none":null}'),
    });

    expect(await screen.findByText("name:")).toBeTruthy();
    expect(screen.getByText('"Fithuner"')).toBeTruthy();
    expect(screen.getByText("true")).toBeTruthy();
    expect(screen.getByText("[2]")).toBeTruthy();
    expect(screen.getByText("{5}")).toBeTruthy();
  });

  it("reports invalid JSON with the parser message", async () => {
    await renderWithPreview(<JsonPreview {...props("broken.json")} />, { gateway: gatewayReturning("{ not json") });

    expect(await screen.findByText("This is not valid JSON")).toBeTruthy();
  });

  it("limits very long arrays", async () => {
    const items = JSON.stringify(Array.from({ length: 250 }, (_, index) => index));
    await renderWithPreview(<JsonPreview {...props("big.json")} />, { gateway: gatewayReturning(items) });

    expect(await screen.findByText("… 50 more")).toBeTruthy();
  });
});

describe("CsvPreview", () => {
  it("renders a table with a header", async () => {
    await renderWithPreview(<CsvPreview {...props("people.csv")} />, {
      gateway: gatewayReturning('name,city\nAda,"London, UK"\nLinus,Helsinki'),
    });

    expect(await screen.findByRole("columnheader", { name: "name" })).toBeTruthy();
    expect(screen.getByRole("cell", { name: "London, UK" })).toBeTruthy();
    expect(screen.getAllByRole("row")).toHaveLength(3);
  });

  it("detects semicolon separated files", async () => {
    await renderWithPreview(<CsvPreview {...props("eu.csv")} />, { gateway: gatewayReturning("a;b\n1;2") });

    expect(await screen.findByRole("columnheader", { name: "b" })).toBeTruthy();
  });

  it("limits the visible rows", async () => {
    const rows = ["id", ...Array.from({ length: 600 }, (_, index) => String(index))].join("\n");
    await renderWithPreview(<CsvPreview {...props("long.csv")} />, { gateway: gatewayReturning(rows) });

    expect(await screen.findByText("Showing the first 500 of 600 rows.")).toBeTruthy();
  });
});
