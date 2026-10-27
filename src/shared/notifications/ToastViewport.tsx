import { useEffect } from "react";
import { useToasts } from "./ToastContext";
import styles from "./ToastViewport.module.css";

const TOAST_LIFETIME_MS = 5000;

export function ToastViewport() {
  const toasts = useToasts((state) => state.toasts);
  const dismiss = useToasts((state) => state.dismiss);

  useEffect(() => {
    const timers = toasts.map((toast) => setTimeout(() => dismiss(toast.id), TOAST_LIFETIME_MS));
    return () => timers.forEach(clearTimeout);
  }, [toasts, dismiss]);

  return (
    <div className={styles.viewport} role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${styles.toast} ${toast.tone === "error" ? styles.error : ""}`}
        >
          <span>{toast.message}</span>
          <button type="button" className="icon-button" aria-label="Dismiss" onClick={() => dismiss(toast.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
