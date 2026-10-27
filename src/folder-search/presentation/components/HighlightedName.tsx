import { highlightSegments } from "../../domain/services/highlight-match";
import styles from "./HighlightedName.module.css";

interface HighlightedNameProps {
  name: string;
  query: string;
}

export function HighlightedName({ name, query }: HighlightedNameProps) {
  return (
    <>
      {highlightSegments(name, query).map((segment, index) =>
        segment.isMatch ? (
          <mark key={index} className={styles.match}>
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </>
  );
}
