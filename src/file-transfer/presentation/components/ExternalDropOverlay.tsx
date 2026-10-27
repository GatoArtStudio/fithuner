import { useEffect } from "react";
import { highlightDropTarget, lastPathSegment } from "../../../shared/drag-and-drop/drop-targets";
import { useFileTransfer } from "../context/FileTransferContext";
import styles from "./ExternalDropOverlay.module.css";

export function ExternalDropOverlay() {
  const target = useFileTransfer((state) => state.externalDropTarget);

  useEffect(() => {
    highlightDropTarget(target);
    return () => highlightDropTarget(null);
  }, [target]);

  if (target === null) return null;

  return (
    <div className={styles.banner} role="status">
      Drop to copy into {lastPathSegment(target)}
    </div>
  );
}
