import { useId } from "react";
import styles from "./SettingControls.module.css";

interface SettingToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function SettingToggle({ label, description, checked, onChange }: SettingToggleProps) {
  const descriptionId = useId();

  return (
    <div className={styles.row}>
      <div className={styles.text}>
        <span className={styles.label}>{label}</span>
        <span id={descriptionId} className={styles.description}>
          {description}
        </span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        aria-describedby={descriptionId}
        className={`${styles.switch} ${checked ? styles.on : ""}`}
        onClick={() => onChange(!checked)}
      >
        <span className={styles.knob} />
      </button>
    </div>
  );
}
