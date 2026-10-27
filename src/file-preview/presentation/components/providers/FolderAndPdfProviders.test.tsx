import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PreviewTarget } from "../../../domain/entities/preview";
import { createFakeGateway, renderWithPreview } from "../test-support";
import { FolderPreview } from "./FolderPreview";

vi.mock("../../rendering/load-pdfjs", () => ({
  loadPdfjs: () => Promise.reject(new Error("pdf.js is unavailable in tests")),
}));

import PdfPreview from "./PdfPreview";

const folder: PreviewTarget = { path: "/files/photos", name: "photos", kind: "directory", sizeInBytes: 0, modifiedAtMillis: null };
const pdf: PreviewTarget = { path: "/files/manual.pdf", name: "manual.pdf", kind: "file", sizeInBytes: 10, modifiedAtMillis: null };
const props = (target: PreviewTarget) => ({ target, variant: "panel" as const, onOpenExternally: vi.fn() });

describe("FolderPreview", () => {
  it("shows the number of files, folders and the total size", async () => {
    const gateway = createFakeGateway({
      summarizeFolder: vi.fn().mockResolvedValue({ fileCount: 1234, folderCount: 5, totalBytes: 3 * 1024 * 1024, isPartial: false }),
    });
    await renderWithPreview(<FolderPreview {...props(folder)} />, { gateway });

    expect(await screen.findByText("1,234")).toBeTruthy();
    expect(screen.getByText("3 MB")).toBeTruthy();
    expect(screen.queryByRole("note")).toBeNull();
  });

  it("warns when the folder was too big to count completely", async () => {
    const gateway = createFakeGateway({
      summarizeFolder: vi.fn().mockResolvedValue({ fileCount: 50000, folderCount: 10, totalBytes: 1, isPartial: true }),
    });
    await renderWithPreview(<FolderPreview {...props(folder)} />, { gateway });

    expect(await screen.findByRole("note")).toBeTruthy();
  });

  it("reports unreadable folders", async () => {
    const gateway = createFakeGateway({
      summarizeFolder: vi.fn().mockRejectedValue({ kind: "permissionDenied", message: "Permission denied" }),
    });
    await renderWithPreview(<FolderPreview {...props(folder)} />, { gateway });

    expect(await screen.findByText("This folder cannot be read")).toBeTruthy();
  });
});

describe("PdfPreview", () => {
  it("falls back to the default app when the document cannot be loaded", async () => {
    await renderWithPreview(<PdfPreview {...props(pdf)} />);

    expect(await screen.findByText("This PDF could not be displayed")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Open with default app" })).toBeTruthy();
  });
});
