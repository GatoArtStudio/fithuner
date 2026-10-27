import type { PanelPosition } from "../../../settings";

export const MIN_PANEL_SIZE_PX = 200;
const MAX_PANEL_FRACTION = 0.7;
const ABSOLUTE_MAX_PANEL_SIZE_PX = 1200;

export interface ContainerBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export function clampPanelSize(size: number, containerLength: number): number {
  const max =
    containerLength > 0
      ? Math.min(ABSOLUTE_MAX_PANEL_SIZE_PX, Math.max(MIN_PANEL_SIZE_PX, containerLength * MAX_PANEL_FRACTION))
      : ABSOLUTE_MAX_PANEL_SIZE_PX;
  return Math.round(Math.min(max, Math.max(MIN_PANEL_SIZE_PX, size)));
}

export function panelSizeFromPointer(
  position: PanelPosition,
  pointer: { x: number; y: number },
  container: ContainerBounds,
): number {
  if (position === "right") {
    return clampPanelSize(container.right - pointer.x, container.right - container.left);
  }
  return clampPanelSize(container.bottom - pointer.y, container.bottom - container.top);
}
