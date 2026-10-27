import { formatFileSize, formatModifiedDate } from "../../../directory-browsing";
import type { PreviewTarget } from "../../domain/entities/preview";
import styles from "./PreviewHeader.module.css";

interface PreviewHeaderProps {
  target: PreviewTarget;
  onOpenExternally: (path: string) => void;
  onClose?: () => void;
}

export function PreviewHeader({ target, onOpenExternally, onClose }: PreviewHeaderProps) {
  const size = target.kind === "file" ? `${formatFileSize(target.sizeInBytes)} · ` : "";

  return (
    <header className={styles.header}>
      <div className={styles.text}>
        <span className={styles.name} title={target.name}>
          {target.name}
        </span>
        <span className={styles.meta}>
          {size}
          {formatModifiedDate(target.modifiedAtMillis)}
        </span>
      </div>
      {target.kind === "file" && (
        <button type="button" className={styles.button} onClick={() => onOpenExternally(target.path)}>
          Open
        </button>
      )}
      {onClose && (
        <button type="button" className="icon-button" aria-label="Close preview" title="Close preview (Alt+P)" onClick={onClose}>
          ×
        </button>
      )}
    </header>
  );
}
