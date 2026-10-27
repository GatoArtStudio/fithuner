import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PreviewTarget } from "../../domain/entities/preview";
import { PreviewBody } from "./PreviewBody";
import { renderWithPreview } from "./test-support";

const MB = 1024 * 1024;

function target(name: string, sizeInBytes = 100, kind: "file" | "directory" = "file"): PreviewTarget {
  return { path: `/files/${name}`, name, kind, sizeInBytes, modifiedAtMillis: null };
}

function body(previewTarget: PreviewTarget, onOpenExternally = vi.fn()) {
  return <PreviewBody target={previewTarget} variant="panel" onOpenExternally={onOpenExternally} />;
}

describe("PreviewBody", () => {
  it("renders images through the asset url", async () => {
    await renderWithPreview(body(target("photo.png")));

    const image = screen.getByRole("img", { name: "photo.png" });
    expect(image.getAttribute("src")).toBe("asset:///files/photo.png");
  });

  it("offers the default app when an image cannot be displayed", async () => {
    const onOpenExternally = vi.fn();
    await renderWithPreview(body(target("broken.png"), onOpenExternally));

    fireEvent.error(screen.getByRole("img", { name: "broken.png" }));
    fireEvent.click(screen.getByRole("button", { name: "Open with default app" }));

    expect(screen.getByText("This image could not be displayed")).toBeTruthy();
    expect(onOpenExternally).toHaveBeenCalledWith("/files/broken.png");
  });

  it("explains that a provider is turned off", async () => {
    await renderWithPreview(body(target("clip.mp4")), {
      settings: { preview: { providers: { video: { enabled: false } } } },
    });

    expect(screen.getByText("Preview is turned off for video files")).toBeTruthy();
    expect(screen.getByText("You can turn it on in Settings > Preview.")).toBeTruthy();
  });

  it("shows the limit for large files and lets images be previewed anyway", async () => {
    const { previewStore } = await renderWithPreview(body(target("huge.png", 30 * MB)));

    expect(screen.getByText("This file is too large to preview")).toBeTruthy();
    expect(screen.getByText("30 MB is over the limit of 25 MB.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Preview anyway" }));

    expect(previewStore.getState().forcedPaths).toEqual(["/files/huge.png"]);
  });

  it("does not offer to force the preview of large JSON files", async () => {
    await renderWithPreview(body(target("big.json", 10 * MB)));

    expect(screen.queryByRole("button", { name: "Preview anyway" })).toBeNull();
    expect(screen.getByRole("button", { name: "Open with default app" })).toBeTruthy();
  });

  it("says when there is no preview for a type", async () => {
    await renderWithPreview(body(target("archive.zip")));

    expect(screen.getByText("No preview for this type of file")).toBeTruthy();
  });
});
