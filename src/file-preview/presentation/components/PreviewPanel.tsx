import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { usePreviewLayout } from "../hooks/usePreviewLayout";
import type { PreviewTarget } from "../../domain/entities/preview";
import { PreviewBody } from "./PreviewBody";
import { PreviewHeader } from "./PreviewHeader";
import { PreviewMessage } from "./PreviewStates";
import { PreviewSplitter } from "./PreviewSplitter";
import styles from "./PreviewPanel.module.css";

const SELECTION_DEBOUNCE_MS = 150;

interface PreviewPanelProps {
  target: PreviewTarget | null;
  selectionCount: number;
  onOpenExternally: (path: string) => void;
}

export function PreviewPanel({ target, selectionCount, onOpenExternally }: PreviewPanelProps) {
  const { isPanelVisible, position, sizePx, hidePanel, resizePanel } = usePreviewLayout();
  const debouncedTarget = useDebouncedValue(target, SELECTION_DEBOUNCE_MS);

  if (!isPanelVisible) return null;

  const shownTarget = selectionCount === 1 ? debouncedTarget : null;

  return (
    <aside className={`${styles.panel} ${position === "right" ? styles.onRight : styles.onBottom}`} aria-label="Preview">
      <PreviewSplitter position={position} sizePx={sizePx} onResize={resizePanel} />
      {shownTarget ? (
        <>
          <PreviewHeader target={shownTarget} onOpenExternally={onOpenExternally} onClose={hidePanel} />
          <div className={styles.body}>
            <PreviewBody key={shownTarget.path} target={shownTarget} variant="panel" onOpenExternally={onOpenExternally} />
          </div>
        </>
      ) : (
        <PreviewMessage
          title={selectionCount > 1 ? `${selectionCount} items selected` : "Select a file to preview it"}
          detail={selectionCount > 1 ? "Select a single item to see its preview." : "Press Space for a larger Quick Look."}
        />
      )}
    </aside>
  );
}
