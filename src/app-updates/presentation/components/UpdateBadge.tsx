import { selectHasPendingUpdate } from "../../application/stores/updates-store";
import { useUpdates } from "../context/UpdatesContext";
import styles from "./UpdateBadge.module.css";

export function UpdateBadge() {
  const hasPendingUpdate = useUpdates(selectHasPendingUpdate);

  if (!hasPendingUpdate) return null;
  return <span className={styles.badge} role="img" aria-label="An update is available" />;
}
