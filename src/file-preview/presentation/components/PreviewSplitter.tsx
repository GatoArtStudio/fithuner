import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import type { PanelPosition } from "../../../settings";
import { clampPanelSize, panelSizeFromPointer } from "../../domain/services/panel-size";
import styles from "./PreviewSplitter.module.css";

const KEYBOARD_STEP_PX = 16;

interface PreviewSplitterProps {
  position: PanelPosition;
  sizePx: number;
  onResize: (sizePx: number) => void;
}

export function PreviewSplitter({ position, sizePx, onResize }: PreviewSplitterProps) {
  const draggedSize = useRef<number | null>(null);

  function containerOf(element: HTMLElement): HTMLElement | null {
    return element.parentElement?.parentElement ?? null;
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    draggedSize.current = sizePx;
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (draggedSize.current === null) return;
    const container = containerOf(event.currentTarget);
    if (!container) return;
    const size = panelSizeFromPointer(position, { x: event.clientX, y: event.clientY }, container.getBoundingClientRect());
    draggedSize.current = size;
    container.style.setProperty("--panel-size", `${size}px`);
  }

  function handlePointerUp() {
    if (draggedSize.current !== null && draggedSize.current !== sizePx) onResize(draggedSize.current);
    draggedSize.current = null;
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const growKey = position === "right" ? "ArrowLeft" : "ArrowUp";
    const shrinkKey = position === "right" ? "ArrowRight" : "ArrowDown";
    if (event.key !== growKey && event.key !== shrinkKey) return;
    event.preventDefault();
    const container = containerOf(event.currentTarget);
    const length = container
      ? position === "right"
        ? container.clientWidth
        : container.clientHeight
      : sizePx * 3;
    const delta = event.key === growKey ? KEYBOARD_STEP_PX : -KEYBOARD_STEP_PX;
    onResize(clampPanelSize(sizePx + delta, length));
  }

  return (
    <div
      className={`${styles.splitter} ${position === "right" ? styles.vertical : styles.horizontal}`}
      role="separator"
      aria-orientation={position === "right" ? "vertical" : "horizontal"}
      aria-label="Resize preview panel"
      aria-valuenow={sizePx}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
    />
  );
}
