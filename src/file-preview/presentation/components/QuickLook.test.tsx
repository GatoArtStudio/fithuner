import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PreviewTarget } from "../../domain/entities/preview";
import { QuickLook } from "./QuickLook";
import { renderWithPreview } from "./test-support";

const photo: PreviewTarget = {
  path: "/files/photo.png",
  name: "photo.png",
  kind: "file",
  sizeInBytes: 100,
  modifiedAtMillis: null,
};

async function renderOpen(options: Parameters<typeof renderWithPreview>[1] = {}, target: PreviewTarget | null = photo) {
  const onStep = vi.fn();
  const rendered = await renderWithPreview(
    <QuickLook target={target} onStep={onStep} onOpenExternally={vi.fn()} />,
    { ...options, quickLookOpen: true },
  );
  return { ...rendered, onStep };
}

describe("QuickLook", () => {
  it("is closed until it is opened", async () => {
    await renderWithPreview(<QuickLook target={photo} onStep={vi.fn()} onOpenExternally={vi.fn()} />);

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens a large preview of the target", async () => {
    await renderOpen();

    expect(await screen.findByRole("dialog", { name: "Quick Look: photo.png" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "photo.png" })).toBeTruthy();
  });

  it.each([
    ["Space", " "],
    ["Escape", "Escape"],
  ])("closes with %s", async (_name, key) => {
    const { previewStore } = await renderOpen();

    fireEvent.keyDown(await screen.findByRole("dialog"), { key });

    expect(previewStore.getState().isQuickLookOpen).toBe(false);
  });

  it("closes when the backdrop is clicked but not when the dialog is", async () => {
    const { previewStore } = await renderOpen();
    const dialog = await screen.findByRole("dialog");

    fireEvent.click(dialog);
    expect(previewStore.getState().isQuickLookOpen).toBe(true);

    fireEvent.click(dialog.parentElement as HTMLElement);
    expect(previewStore.getState().isQuickLookOpen).toBe(false);
  });

  it("asks to browse to the next and previous file with the arrow keys", async () => {
    const { onStep } = await renderOpen();
    const dialog = await screen.findByRole("dialog");

    fireEvent.keyDown(dialog, { key: "ArrowDown" });
    fireEvent.keyDown(dialog, { key: "ArrowUp" });

    expect(onStep).toHaveBeenNthCalledWith(1, 1);
    expect(onStep).toHaveBeenNthCalledWith(2, -1);
  });

  it("stays closed when Quick Look is disabled in settings", async () => {
    await renderOpen({ settings: { preview: { quickLookEnabled: false } } });

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("stays closed when there is nothing to show", async () => {
    await renderOpen({}, null);

    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
