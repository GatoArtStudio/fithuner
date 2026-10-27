import { useCallback } from "react";
import { useDragAndDropConfig } from "./DragAndDropContext";
import { findDropTargetAt, highlightDropTarget } from "./drop-targets";

const DRAG_START_DISTANCE_PX = 5;

export interface DragPayload {
  paths: string[];
  label: string;
}

export interface DragStartEvent {
  button: number;
  clientX: number;
  clientY: number;
}

export function useDragSource() {
  const { store, canDrop, onDrop } = useDragAndDropConfig();

  return useCallback(
    (startEvent: DragStartEvent, payload: DragPayload) => {
      if (startEvent.button !== 0) return;

      let isDragging = false;
      let hoverPath: string | null = null;
      let isCopy = false;

      function resolveHover(event: PointerEvent) {
        isCopy = event.ctrlKey || event.metaKey;
        const candidate = findDropTargetAt(event.clientX, event.clientY);
        hoverPath = candidate !== null && canDrop(payload.paths, candidate) ? candidate : null;
        highlightDropTarget(hoverPath);
      }

      function handlePointerMove(event: PointerEvent) {
        if (!isDragging) {
          const distance = Math.hypot(event.clientX - startEvent.clientX, event.clientY - startEvent.clientY);
          if (distance < DRAG_START_DISTANCE_PX) return;
          isDragging = true;
          store.getState().begin({
            label: payload.label,
            itemCount: payload.paths.length,
            x: event.clientX,
            y: event.clientY,
            hoverPath: null,
            isCopy: false,
          });
        }
        resolveHover(event);
        store.getState().update({ x: event.clientX, y: event.clientY, hoverPath, isCopy });
      }

      function finish(shouldDrop: boolean) {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointercancel", handleCancel);
        window.removeEventListener("keydown", handleKeyDown, true);
        window.removeEventListener("blur", handleCancel);
        if (!isDragging) return;

        const dropTarget = hoverPath;
        highlightDropTarget(null);
        store.getState().end();
        suppressNextClick();
        if (shouldDrop && dropTarget !== null) {
          onDrop({ paths: payload.paths, targetPath: dropTarget, isCopy });
        }
      }

      function handlePointerUp() {
        finish(true);
      }

      function handleCancel() {
        finish(false);
      }

      function handleKeyDown(event: KeyboardEvent) {
        if (event.key !== "Escape") return;
        event.stopPropagation();
        finish(false);
      }

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handleCancel);
      window.addEventListener("keydown", handleKeyDown, true);
      window.addEventListener("blur", handleCancel);
    },
    [store, canDrop, onDrop],
  );
}

function suppressNextClick() {
  const swallow = (event: MouseEvent) => event.stopPropagation();
  window.addEventListener("click", swallow, { capture: true, once: true });
  setTimeout(() => window.removeEventListener("click", swallow, true), 0);
}
