import { describe, expect, it } from "vitest";
import { createPreviewStore } from "./preview-store";

describe("preview store", () => {
  it("opens, closes and toggles Quick Look", () => {
    const store = createPreviewStore();

    store.getState().openQuickLook();
    expect(store.getState().isQuickLookOpen).toBe(true);

    store.getState().toggleQuickLook();
    expect(store.getState().isQuickLookOpen).toBe(false);

    store.getState().toggleQuickLook();
    store.getState().closeQuickLook();
    expect(store.getState().isQuickLookOpen).toBe(false);
  });

  it("remembers forced previews without duplicates", () => {
    const store = createPreviewStore();

    store.getState().forcePreview("/big.png");
    store.getState().forcePreview("/big.png");

    expect(store.getState().forcedPaths).toEqual(["/big.png"]);
  });
});
