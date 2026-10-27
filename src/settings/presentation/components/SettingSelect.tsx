import { useId } from "react";
import styles from "./SettingControls.module.css";

interface SettingSelectProps<Value extends string> {
  label: string;
  description: string;
  value: Value;
  options: { value: Value; label: string }[];
  onChange: (value: Value) => void;
}

export function SettingSelect<Value extends string>({
  label,
  description,
  value,
  options,
  onChange,
}: SettingSelectProps<Value>) {
  const selectId = useId();

  return (
    <div className={styles.row}>
      <div className={styles.text}>
        <label htmlFor={selectId} className={styles.label}>
          {label}
        </label>
        <span className={styles.description}>{description}</span>
      </div>
      <select
        id={selectId}
        className={styles.select}
        value={value}
        onChange={(event) => onChange(event.target.value as Value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
