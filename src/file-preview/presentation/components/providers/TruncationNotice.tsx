import { formatFileSize } from "../../../../directory-browsing";
import type { TextPreviewResult } from "../../../application/ports/preview-gateway";
import styles from "./TextPreview.module.css";

export function TruncationNotice({ content }: { content: TextPreviewResult }) {
  if (!content.isTruncated) return null;

  return (
    <p className={styles.notice} role="note">
      Showing the beginning of the file. The full file is {formatFileSize(content.totalBytes)}.
    </p>
  );
}
