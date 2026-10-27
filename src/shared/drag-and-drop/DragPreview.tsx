import { useDragSession } from "./DragAndDropContext";
import { lastPathSegment } from "./drop-targets";
import styles from "./DragPreview.module.css";

export function DragPreview() {
  const session = useDragSession((state) => state.session);

  if (!session) return null;

  const verb = session.isCopy ? "Copy" : "Move";
  const title = session.itemCount > 1 ? `${session.itemCount} items` : session.label;

  return (
    <div className={styles.preview} style={{ left: session.x + 14, top: session.y + 14 }} aria-hidden="true">
      <span className={styles.title}>{title}</span>
      {session.hoverPath !== null && (
        <span className={styles.destination}>
          {verb} to {lastPathSegment(session.hoverPath)}
        </span>
      )}
    </div>
  );
}
