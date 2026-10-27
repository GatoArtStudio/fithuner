import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PreviewTarget } from "../../../domain/entities/preview";
import { renderWithPreview } from "../test-support";
import { MediaPreview } from "./MediaPreview";

const clip: PreviewTarget = { path: "/files/clip.mp4", name: "clip.mp4", kind: "file", sizeInBytes: 1, modifiedAtMillis: null };

function renderMedia(media: "audio" | "video", onOpenExternally = vi.fn()) {
  return renderWithPreview(
    <MediaPreview target={clip} variant="panel" media={media} onOpenExternally={onOpenExternally} />,
  );
}

describe("MediaPreview", () => {
  it("does not create a media element until the user asks to play", async () => {
    await renderMedia("video");

    expect(document.querySelector("video")).toBeNull();
    expect(screen.getByRole("button", { name: "Play video" })).toBeTruthy();
  });

  it("mounts the player with the asset url after pressing play", async () => {
    await renderMedia("video");

    fireEvent.click(screen.getByRole("button", { name: "Play video" }));

    expect(document.querySelector("video")?.getAttribute("src")).toBe("asset:///files/clip.mp4");
  });

  it("uses an audio element for audio files", async () => {
    await renderMedia("audio");

    fireEvent.click(screen.getByRole("button", { name: "Play audio" }));

    expect(document.querySelector("audio")).not.toBeNull();
  });

  it("points to the GStreamer plugins and the default app when playback fails", async () => {
    const onOpenExternally = vi.fn();
    await renderMedia("video", onOpenExternally);
    fireEvent.click(screen.getByRole("button", { name: "Play video" }));

    fireEvent.error(document.querySelector("video") as HTMLVideoElement);
    fireEvent.click(screen.getByRole("button", { name: "Open with default app" }));

    expect(screen.getByText(/GStreamer plugins/)).toBeTruthy();
    expect(onOpenExternally).toHaveBeenCalledWith("/files/clip.mp4");
  });
});
