import { describe, expect, it } from "vitest";
import {
  FIT_VIEWPORT,
  MAX_SCALE,
  MIN_SCALE,
  clampViewport,
  panBy,
  wheelZoomFactor,
  zoomAt,
} from "./image-viewport";

const layout = { image: { width: 400, height: 200 }, frame: { width: 400, height: 300 } };

describe("image viewport", () => {
  it("zooms around the center without moving the image", () => {
    const zoomed = zoomAt(FIT_VIEWPORT, 2, { x: 0, y: 0 }, layout);

    expect(zoomed).toEqual({ scale: 2, x: 0, y: 0 });
  });

  it("keeps the point under the pointer in place while zooming", () => {
    const pointer = { x: 100, y: 0 };

    const zoomed = zoomAt(FIT_VIEWPORT, 2, pointer, layout);

    expect(zoomed.scale).toBe(2);
    expect(zoomed.x).toBe(-100);
    const before = pointer.x - FIT_VIEWPORT.x;
    const after = (pointer.x - zoomed.x) / (zoomed.scale / FIT_VIEWPORT.scale);
    expect(after).toBe(before);
  });

  it("limits the zoom", () => {
    expect(zoomAt(FIT_VIEWPORT, 1000, { x: 0, y: 0 }, layout).scale).toBe(MAX_SCALE);
    expect(zoomAt(FIT_VIEWPORT, 0.0001, { x: 0, y: 0 }, layout).scale).toBe(MIN_SCALE);
  });

  it("does not let the image move while it fits in the frame", () => {
    expect(panBy(FIT_VIEWPORT, 50, -50, layout)).toEqual(FIT_VIEWPORT);
  });

  it("moves a zoomed image only until its edge reaches the frame edge", () => {
    const zoomed = { scale: 2, x: 0, y: 0 };

    expect(panBy(zoomed, 1000, 1000, layout)).toEqual({ scale: 2, x: 200, y: 50 });
    expect(panBy(zoomed, -1000, -1000, layout)).toEqual({ scale: 2, x: -200, y: -50 });
    expect(panBy(zoomed, 30, -20, layout)).toEqual({ scale: 2, x: 30, y: -20 });
  });

  it("pulls the image back inside when zooming out", () => {
    const panned = { scale: 2, x: 200, y: 50 };

    expect(clampViewport({ ...panned, scale: 1 }, layout)).toEqual({ scale: 1, x: 0, y: 0 });
  });

  it("turns wheel movement into zoom in and zoom out", () => {
    expect(wheelZoomFactor(-100, 0)).toBeGreaterThan(1);
    expect(wheelZoomFactor(100, 0)).toBeLessThan(1);
    expect(wheelZoomFactor(0, 0)).toBe(1);
    expect(wheelZoomFactor(-3, 1)).toBeCloseTo(wheelZoomFactor(-48, 0));
  });
});
