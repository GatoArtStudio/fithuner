import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PreviewTarget } from "../../../domain/entities/preview";
import { resetAssetStreamingSupport } from "../../rendering/media-streaming-support";
import { MEDIA_MEMORY_FALLBACK_LIMIT_BYTES, MediaPreview } from "./MediaPreview";
import { renderWithPreview } from "../test-support";

const clip: PreviewTarget = { path: "/files/clip.mp4", name: "clip.mp4", kind: "file", sizeInBytes: 1024, modifiedAtMillis: null };

function renderMedia(media: "audio" | "video", { target = clip, onOpenExternally = vi.fn() } = {}) {
  return renderWithPreview(
    <MediaPreview target={target} variant="panel" media={media} onOpenExternally={onOpenExternally} />,
  );
}

function player(media: "audio" | "video" = "video") {
  return document.querySelector(media) as HTMLMediaElement | null;
}

beforeEach(() => {
  resetAssetStreamingSupport();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, blob: async () => new Blob(["data"]) }));
  URL.createObjectURL = vi.fn(() => "blob:memory-copy");
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => vi.unstubAllGlobals());

describe("MediaPreview", () => {
  it("does not create a media element until the user asks to play", async () => {
    await renderMedia("video");

    expect(player()).toBeNull();
    expect(screen.getByRole("button", { name: "Play video" })).toBeTruthy();
  });

  it("first tries to stream from the asset url with CORS", async () => {
    await renderMedia("video");

    fireEvent.click(screen.getByRole("button", { name: "Play video" }));

    expect(player()?.getAttribute("src")).toBe("asset:///files/clip.mp4");
    expect(player()?.getAttribute("crossorigin")).toBe("anonymous");
  });

  it("uses an audio element for audio files", async () => {
    await renderMedia("audio");

    fireEvent.click(screen.getByRole("button", { name: "Play audio" }));

    expect(player("audio")).not.toBeNull();
  });

  it("falls back to an in-memory copy when the engine cannot stream the asset url", async () => {
    await renderMedia("video");
    fireEvent.click(screen.getByRole("button", { name: "Play video" }));

    fireEvent.error(player() as HTMLMediaElement);

    await waitFor(() => expect(player()?.getAttribute("src")).toBe("blob:memory-copy"));
    expect(fetch).toHaveBeenCalledWith("asset:///files/clip.mp4");
  });

  it("goes straight to the in-memory copy once streaming is known to fail", async () => {
    const first = await renderMedia("video");
    fireEvent.click(screen.getByRole("button", { name: "Play video" }));
    fireEvent.error(player() as HTMLMediaElement);
    await waitFor(() => expect(player()?.getAttribute("src")).toBe("blob:memory-copy"));
    first.unmount();

    await renderMedia("video");
    fireEvent.click(screen.getByRole("button", { name: "Play video" }));

    await waitFor(() => expect(player()?.getAttribute("src")).toBe("blob:memory-copy"));
    expect(player()?.hasAttribute("crossorigin")).toBe(false);
  });

  it("releases the in-memory copy when the preview goes away", async () => {
    const { unmount } = await renderMedia("video");
    fireEvent.click(screen.getByRole("button", { name: "Play video" }));
    fireEvent.error(player() as HTMLMediaElement);
    await waitFor(() => expect(player()?.getAttribute("src")).toBe("blob:memory-copy"));

    unmount();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:memory-copy");
  });

  it("explains the failure when even the in-memory copy cannot be played", async () => {
    const onOpenExternally = vi.fn();
    await renderMedia("video", { onOpenExternally });
    fireEvent.click(screen.getByRole("button", { name: "Play video" }));
    fireEvent.error(player() as HTMLMediaElement);
    await waitFor(() => expect(player()?.getAttribute("src")).toBe("blob:memory-copy"));

    fireEvent.error(player() as HTMLMediaElement);
    fireEvent.click(await screen.findByRole("button", { name: "Open with default app" }));

    expect(screen.getByText(/GStreamer plugin/)).toBeTruthy();
    expect(onOpenExternally).toHaveBeenCalledWith("/files/clip.mp4");
  });

  it("reports a file that cannot be read for the in-memory copy", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403 }));
    await renderMedia("video");
    fireEvent.click(screen.getByRole("button", { name: "Play video" }));

    fireEvent.error(player() as HTMLMediaElement);

    expect(await screen.findByText(/HTTP 403/)).toBeTruthy();
  });

  it("does not try to load huge files in memory", async () => {
    const hugeTarget = { ...clip, sizeInBytes: MEDIA_MEMORY_FALLBACK_LIMIT_BYTES + 1 };
    await renderMedia("video", { target: hugeTarget });
    fireEvent.click(screen.getByRole("button", { name: "Play video" }));

    fireEvent.error(player() as HTMLMediaElement);

    expect(await screen.findByText(/too large/)).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
  });
});
