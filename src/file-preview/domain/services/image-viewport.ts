export interface Viewport {
  scale: number;
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface ViewportLayout {
  image: Size;
  frame: Size;
}

export const FIT_VIEWPORT: Viewport = { scale: 1, x: 0, y: 0 };
export const MIN_SCALE = 0.25;
export const MAX_SCALE = 16;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Keeps the image from being dragged away: it may only move while it is larger than the frame. */
export function clampViewport(viewport: Viewport, { image, frame }: ViewportLayout): Viewport {
  const maxX = Math.max(0, (image.width * viewport.scale - frame.width) / 2);
  const maxY = Math.max(0, (image.height * viewport.scale - frame.height) / 2);
  // Adding 0 turns a negative zero into a plain zero.
  return { ...viewport, x: clamp(viewport.x, -maxX, maxX) + 0, y: clamp(viewport.y, -maxY, maxY) + 0 };
}

/** Zooms by `factor` keeping the point under the pointer (measured from the frame's center) where it is. */
export function zoomAt(viewport: Viewport, factor: number, pointer: { x: number; y: number }, layout: ViewportLayout): Viewport {
  const scale = clamp(viewport.scale * factor, MIN_SCALE, MAX_SCALE);
  const ratio = scale / viewport.scale;
  return clampViewport(
    {
      scale,
      x: pointer.x - (pointer.x - viewport.x) * ratio,
      y: pointer.y - (pointer.y - viewport.y) * ratio,
    },
    layout,
  );
}

export function panBy(viewport: Viewport, deltaX: number, deltaY: number, layout: ViewportLayout): Viewport {
  return clampViewport({ ...viewport, x: viewport.x + deltaX, y: viewport.y + deltaY }, layout);
}

/** Wheel notches become a smooth multiplicative factor; wheels that report lines are scaled to pixels. */
export function wheelZoomFactor(deltaY: number, deltaMode: number): number {
  const pixels = deltaMode === 1 ? deltaY * 16 : deltaY;
  return Math.exp(-pixels * 0.0015);
}
