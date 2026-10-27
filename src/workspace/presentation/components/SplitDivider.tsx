import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import { blockSelection } from "../../../shared/drag-and-drop/block-selection";
import { MAX_SPLIT_RATIO, MIN_SPLIT_RATIO } from "../../domain/entities/workspace";
import { useWorkspace } from "../context/WorkspaceContext";
import styles from "./SplitDivider.module.css";

const KEYBOARD_STEP = 0.02;

export function SplitDivider() {
  const ratio = useWorkspace((state) => state.workspace.splitRatio);
  const setSplitRatio = useWorkspace((state) => state.setSplitRatio);
  const isDragging = useRef(false);
  const releaseSelection = useRef<(() => void) | null>(null);

  function stopDragging() {
    isDragging.current = false;
    releaseSelection.current?.();
    releaseSelection.current = null;
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!isDragging.current) return;
    const container = event.currentTarget.parentElement;
    if (!container) return;
    const bounds = container.getBoundingClientRect();
    if (bounds.width === 0) return;
    setSplitRatio((event.clientX - bounds.left) / bounds.width);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") setSplitRatio(ratio - KEYBOARD_STEP);
    else if (event.key === "ArrowRight") setSplitRatio(ratio + KEYBOARD_STEP);
    else return;
    event.preventDefault();
  }

  return (
    <div
      className={styles.divider}
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize panes"
      aria-valuemin={Math.round(MIN_SPLIT_RATIO * 100)}
      aria-valuemax={Math.round(MAX_SPLIT_RATIO * 100)}
      aria-valuenow={Math.round(ratio * 100)}
      tabIndex={0}
      onPointerDown={(event) => {
        isDragging.current = true;
        releaseSelection.current = blockSelection();
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
      onKeyDown={handleKeyDown}
    />
  );
}
