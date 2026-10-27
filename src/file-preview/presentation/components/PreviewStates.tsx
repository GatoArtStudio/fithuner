import type { ReactNode } from "react";
import styles from "./PreviewStates.module.css";

interface PreviewMessageProps {
  title: string;
  detail?: string;
  actions?: ReactNode;
}

export function PreviewMessage({ title, detail, actions }: PreviewMessageProps) {
  return (
    <div className={styles.message} role="status">
      <p className={styles.title}>{title}</p>
      {detail && <p className={styles.detail}>{detail}</p>}
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}

export function PreviewLoading() {
  return <PreviewMessage title="Loading preview…" />;
}

interface PreviewActionProps {
  label: string;
  onClick: () => void;
}

export function PreviewAction({ label, onClick }: PreviewActionProps) {
  return (
    <button type="button" className={styles.action} onClick={onClick}>
      {label}
    </button>
  );
}
