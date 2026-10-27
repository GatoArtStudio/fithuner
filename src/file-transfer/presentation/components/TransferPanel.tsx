import { useEffect, useState } from "react";
import type { ActiveTransfer } from "../../application/stores/file-transfer-store";
import { estimateRemainingSeconds, formatDuration, transferPercent } from "../../domain/services/estimate-remaining-time";
import { fileNameOf } from "../../../file-operations";
import { useFileTransfer } from "../context/FileTransferContext";
import styles from "./TransferPanel.module.css";

function describeTransfer(transfer: ActiveTransfer): string {
  const verb = transfer.mode === "copy" ? "Copying" : "Moving";
  const items = transfer.itemCount === 1 ? "1 item" : `${transfer.itemCount} items`;
  return `${verb} ${items} to ${fileNameOf(transfer.destinationDirectory)}`;
}

function TransferRow({ transfer, nowMillis }: { transfer: ActiveTransfer; nowMillis: number }) {
  const cancelTransfer = useFileTransfer((state) => state.cancelTransfer);
  const { progress } = transfer;
  const percent = progress
    ? transferPercent(progress.bytesDone, progress.bytesTotal, progress.filesDone, progress.filesTotal)
    : 0;
  const remainingSeconds = progress
    ? estimateRemainingSeconds(progress.bytesDone, progress.bytesTotal, nowMillis - transfer.startedAtMillis)
    : null;

  return (
    <li className={styles.row}>
      <div className={styles.header}>
        <span className={styles.title}>{describeTransfer(transfer)}</span>
        <button
          type="button"
          className="icon-button"
          aria-label="Cancel transfer"
          title="Cancel transfer"
          onClick={() => void cancelTransfer(transfer.id)}
        >
          ×
        </button>
      </div>
      <div
        className={styles.track}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={describeTransfer(transfer)}
      >
        <div className={styles.fill} style={{ width: `${percent}%` }} />
      </div>
      <div className={styles.details}>
        <span className={styles.currentFile}>{progress ? fileNameOf(progress.currentPath) : "Preparing…"}</span>
        <span>
          {percent}%
          {remainingSeconds !== null && ` · ${formatDuration(remainingSeconds)} left`}
        </span>
      </div>
    </li>
  );
}

export function TransferPanel() {
  const transfers = useFileTransfer((state) => state.transfers);
  const [nowMillis, setNowMillis] = useState(() => Date.now());

  useEffect(() => {
    if (transfers.length === 0) return;
    const timer = setInterval(() => setNowMillis(Date.now()), 500);
    return () => clearInterval(timer);
  }, [transfers.length]);

  if (transfers.length === 0) return null;

  return (
    <ul className={styles.panel} aria-label="Transfers">
      {transfers.map((transfer) => (
        <TransferRow key={transfer.id} transfer={transfer} nowMillis={nowMillis} />
      ))}
    </ul>
  );
}
