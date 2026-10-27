import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PreviewTarget } from "../../domain/entities/preview";
import { PreviewPanel } from "./PreviewPanel";
import { renderWithPreview } from "./test-support";

const photo: PreviewTarget = {
  path: "/files/photo.png",
  name: "photo.png",
  kind: "file",
  sizeInBytes: 2048,
  modifiedAtMillis: null,
};

afterEach(() => vi.useRealTimers());

describe("PreviewPanel", () => {
  it("invites the user to select a file when nothing is selected", async () => {
    await renderWithPreview(<PreviewPanel target={null} selectionCount={0} onOpenExternally={vi.fn()} />);

    expect(screen.getByText("Select a file to preview it")).toBeTruthy();
  });

  it("summarizes a multiple selection instead of previewing it", async () => {
    await renderWithPreview(<PreviewPanel target={photo} selectionCount={3} onOpenExternally={vi.fn()} />);

    expect(screen.getByText("3 items selected")).toBeTruthy();
  });

  it("shows the selected file after the selection settles", async () => {
    vi.useFakeTimers();
    await renderWithPreview(<PreviewPanel target={photo} selectionCount={1} onOpenExternally={vi.fn()} />);

    act(() => vi.advanceTimersByTime(150));

    expect(screen.getByRole("img", { name: "photo.png" })).toBeTruthy();
    expect(screen.getByText("photo.png", { selector: "span" })).toBeTruthy();
  });

  it("renders nothing when the panel is hidden in settings", async () => {
    const { container } = await renderWithPreview(
      <PreviewPanel target={photo} selectionCount={1} onOpenExternally={vi.fn()} />,
      { settings: { preview: { showPanel: false } } },
    );

    expect(container.firstChild).toBeNull();
  });

  it("hides the panel from its close button", async () => {
    vi.useFakeTimers();
    const { settingsStore } = await renderWithPreview(
      <PreviewPanel target={photo} selectionCount={1} onOpenExternally={vi.fn()} />,
    );
    act(() => vi.advanceTimersByTime(150));

    fireEvent.click(screen.getByRole("button", { name: "Close preview" }));

    expect(settingsStore.getState().settings.preview.showPanel).toBe(false);
  });
});
