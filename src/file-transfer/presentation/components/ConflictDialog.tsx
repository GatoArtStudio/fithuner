import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { formatFileSize, formatModifiedDate } from "../../../directory-browsing";
import { fileNameOf } from "../../../file-operations";
import type {
  ConflictEntryInfo,
  ConflictResolution,
  TransferConflict,
} from "../../domain/entities/transfer";
import { useFileTransfer } from "../context/FileTransferContext";
import styles from "./ConflictDialog.module.css";

function describeInfo(info: ConflictEntryInfo): string {
  const size = info.kind === "file" ? `${formatFileSize(info.sizeInBytes)} · ` : "";
  return `${size}${formatModifiedDate(info.modifiedAtMillis)}`;
}

interface ConflictPromptProps {
  conflict: TransferConflict;
}

function ConflictPrompt({ conflict }: ConflictPromptProps) {
  const resolveConflict = useFileTransfer((state) => state.resolveConflict);
  const [applyToAll, setApplyToAll] = useState(false);
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    firstButtonRef.current?.focus();
  }, []);

  function decide(resolution: ConflictResolution) {
    void resolveConflict(conflict.transferId, {
      resolution,
      applyToAll: resolution !== "cancel" && applyToAll,
    });
  }

  function handleKeyDown(event: KeyboardEvent) {
    event.stopPropagation();
    if (event.key === "Escape") decide("cancel");
  }

  return (
    <div className={styles.backdrop} onKeyDown={handleKeyDown}>
      <div className={styles.dialog} role="alertdialog" aria-labelledby="conflict-title" aria-modal="true">
        <h2 id="conflict-title" className={styles.title}>
          "{fileNameOf(conflict.target)}" already exists
        </h2>
        <dl className={styles.comparison}>
          <div>
            <dt>New</dt>
            <dd>{describeInfo(conflict.sourceInfo)}</dd>
          </div>
          <div>
            <dt>Existing</dt>
            <dd>{describeInfo(conflict.targetInfo)}</dd>
          </div>
        </dl>
        <label className={styles.applyToAll}>
          <input type="checkbox" checked={applyToAll} onChange={(event) => setApplyToAll(event.target.checked)} />
          Apply to all conflicts in this transfer
        </label>
        <div className={styles.actions}>
          <button ref={firstButtonRef} type="button" className={styles.button} onClick={() => decide("keepBoth")}>
            Keep both
          </button>
          <button type="button" className={styles.button} onClick={() => decide("skip")}>
            Skip
          </button>
          <button type="button" className={`${styles.button} ${styles.danger}`} onClick={() => decide("replace")}>
            Replace
          </button>
          <button type="button" className={styles.button} onClick={() => decide("cancel")}>
            Cancel transfer
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConflictDialog() {
  const conflict = useFileTransfer(
    (state) => state.transfers.find((transfer) => transfer.pendingConflict !== null)?.pendingConflict ?? null,
  );

  return conflict ? <ConflictPrompt key={`${conflict.transferId}:${conflict.target}`} conflict={conflict} /> : null;
}
