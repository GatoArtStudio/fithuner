import { formatFileSize } from "../../../../directory-browsing";
import { Icon } from "../../../../shared/icons/Icon";
import { usePreviewGateway } from "../../context/PreviewContext";
import { usePreviewResource } from "../../hooks/usePreviewResource";
import { PreviewLoading, PreviewMessage } from "../PreviewStates";
import type { ProviderProps } from "./ProviderProps";
import styles from "./FolderPreview.module.css";

function pluralize(count: number, singular: string, plural: string): string {
  return `${count.toLocaleString("en")} ${count === 1 ? singular : plural}`;
}

export function FolderPreview({ target }: ProviderProps) {
  const gateway = usePreviewGateway();
  const resource = usePreviewResource(`folder:${target.path}`, () => gateway.summarizeFolder(target.path));

  if (resource.status === "error") {
    return <PreviewMessage title="This folder cannot be read" detail={resource.message} />;
  }
  if (resource.status !== "ready") return <PreviewLoading />;

  const summary = resource.data;
  return (
    <div className={styles.summary}>
      <Icon name="folder" size={48} className={styles.icon} />
      <dl className={styles.facts}>
        <div>
          <dt>Files</dt>
          <dd>{summary.fileCount.toLocaleString("en")}</dd>
        </div>
        <div>
          <dt>Folders</dt>
          <dd>{summary.folderCount.toLocaleString("en")}</dd>
        </div>
        <div>
          <dt>Total size</dt>
          <dd>{formatFileSize(summary.totalBytes)}</dd>
        </div>
      </dl>
      <p className={styles.caption}>
        {pluralize(summary.fileCount, "file", "files")} in {pluralize(summary.folderCount + 1, "folder", "folders")}
      </p>
      {summary.isPartial && (
        <p className={styles.partial} role="note">
          This folder is big, so the numbers are a lower bound.
        </p>
      )}
    </div>
  );
}
