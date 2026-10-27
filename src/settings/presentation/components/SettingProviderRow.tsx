import { useId, useState } from "react";
import styles from "./SettingControls.module.css";

const MIN_LIMIT_MB = 1;
const MAX_LIMIT_MB = 4096;

interface SettingProviderRowProps {
  label: string;
  description: string;
  enabled: boolean;
  maxSizeMegabytes?: number;
  disabled?: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onMaxSizeChange?: (megabytes: number) => void;
}

export function SettingProviderRow({
  label,
  description,
  enabled,
  maxSizeMegabytes,
  disabled,
  onEnabledChange,
  onMaxSizeChange,
}: SettingProviderRowProps) {
  const descriptionId = useId();
  const [draft, setDraft] = useState<string | null>(null);

  function commitDraft() {
    if (draft === null) return;
    setDraft(null);
    const parsed = Math.round(Number(draft));
    if (!Number.isFinite(parsed) || draft.trim() === "") return;
    const clamped = Math.min(MAX_LIMIT_MB, Math.max(MIN_LIMIT_MB, parsed));
    if (clamped !== maxSizeMegabytes) onMaxSizeChange?.(clamped);
  }

  return (
    <div className={styles.row}>
      <div className={styles.text}>
        <span className={styles.label}>{label}</span>
        <span id={descriptionId} className={styles.description}>
          {description}
        </span>
      </div>
      <div className={styles.controls}>
        {maxSizeMegabytes !== undefined && (
          <>
            <input
              type="number"
              className={styles.number}
              aria-label={`${label} maximum size in megabytes`}
              min={MIN_LIMIT_MB}
              max={MAX_LIMIT_MB}
              value={draft ?? String(maxSizeMegabytes)}
              disabled={disabled || !enabled}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={commitDraft}
              onKeyDown={(event) => event.key === "Enter" && commitDraft()}
            />
            <span className={styles.unit}>MB</span>
          </>
        )}
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={label}
          aria-describedby={descriptionId}
          disabled={disabled}
          className={`${styles.switch} ${enabled ? styles.on : ""}`}
          onClick={() => onEnabledChange(!enabled)}
        >
          <span className={styles.knob} />
        </button>
      </div>
    </div>
  );
}
