import { useEffect, useRef, type KeyboardEvent } from "react";
import type { PreviewTarget } from "../../domain/entities/preview";
import { usePreview } from "../context/PreviewContext";
import { usePreviewLayout } from "../hooks/usePreviewLayout";
import { PreviewBody } from "./PreviewBody";
import { PreviewHeader } from "./PreviewHeader";
import styles from "./QuickLook.module.css";

interface QuickLookProps {
  target: PreviewTarget | null;
  onStep: (delta: 1 | -1) => void;
  onOpenExternally: (path: string) => void;
}

function QuickLookDialog({ target, onStep, onOpenExternally }: QuickLookProps & { target: PreviewTarget }) {
  const closeQuickLook = usePreview((state) => state.closeQuickLook);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => previouslyFocused?.focus();
  }, []);

  function handleKeyDown(event: KeyboardEvent) {
    event.stopPropagation();
    if (event.key === "Escape" || event.key === " ") closeQuickLook();
    else if (event.key === "ArrowDown" || event.key === "ArrowRight") onStep(1);
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft") onStep(-1);
    else return;
    event.preventDefault();
  }

  return (
    <div className={styles.backdrop} onClick={closeQuickLook}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={`Quick Look: ${target.name}`}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <PreviewHeader target={target} onOpenExternally={onOpenExternally} onClose={closeQuickLook} />
        <div className={styles.body}>
          <PreviewBody key={target.path} target={target} variant="quicklook" onOpenExternally={onOpenExternally} />
        </div>
        <p className={styles.hint}>Space or Esc to close · ↑ ↓ to browse</p>
      </div>
    </div>
  );
}

export function QuickLook(props: QuickLookProps) {
  const isOpen = usePreview((state) => state.isQuickLookOpen);
  const { isQuickLookEnabled } = usePreviewLayout();

  if (!isOpen || !isQuickLookEnabled || !props.target) return null;
  return <QuickLookDialog {...props} target={props.target} />;
}
