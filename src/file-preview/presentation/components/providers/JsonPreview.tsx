import { useMemo } from "react";
import {
  describeJsonContainer,
  jsonChildren,
  jsonKindOf,
} from "../../../domain/services/describe-json-value";
import { PreviewAction, PreviewMessage } from "../PreviewStates";
import type { ProviderProps } from "./ProviderProps";
import { TextContentState } from "./TextContentState";
import styles from "./JsonPreview.module.css";

const MAX_VISIBLE_CHILDREN = 200;
const AUTO_EXPANDED_DEPTH = 2;

interface JsonNodeProps {
  name: string | null;
  value: unknown;
  depth: number;
}

function JsonNode({ name, value, depth }: JsonNodeProps) {
  const kind = jsonKindOf(value);
  const label = name === null ? null : <span className={styles.key}>{name}: </span>;

  if (kind !== "object" && kind !== "array") {
    return (
      <div className={styles.leaf}>
        {label}
        <span className={styles[kind]}>{kind === "string" ? JSON.stringify(value) : String(value)}</span>
      </div>
    );
  }

  const children = jsonChildren(value);
  return (
    <details className={styles.node} open={depth < AUTO_EXPANDED_DEPTH}>
      <summary className={styles.summary}>
        {label}
        <span className={styles.container}>{describeJsonContainer(value)}</span>
      </summary>
      <div className={styles.children}>
        {children.slice(0, MAX_VISIBLE_CHILDREN).map(([childName, childValue]) => (
          <JsonNode key={childName} name={childName} value={childValue} depth={depth + 1} />
        ))}
        {children.length > MAX_VISIBLE_CHILDREN && (
          <div className={styles.more}>… {children.length - MAX_VISIBLE_CHILDREN} more</div>
        )}
      </div>
    </details>
  );
}

function JsonDocument({ source, onOpenExternally, path }: { source: string; path: string; onOpenExternally: (path: string) => void }) {
  const parsed = useMemo(() => {
    try {
      return { value: JSON.parse(source) as unknown, error: null };
    } catch (failure) {
      return { value: null, error: failure instanceof Error ? failure.message : "Invalid JSON" };
    }
  }, [source]);

  if (parsed.error !== null) {
    return (
      <PreviewMessage
        title="This is not valid JSON"
        detail={parsed.error}
        actions={<PreviewAction label="Open with default app" onClick={() => onOpenExternally(path)} />}
      />
    );
  }
  return (
    <div className={styles.tree}>
      <JsonNode name={null} value={parsed.value} depth={0} />
    </div>
  );
}

export function JsonPreview({ target, onOpenExternally }: ProviderProps) {
  return (
    <TextContentState target={target} kind="json" onOpenExternally={onOpenExternally}>
      {(content) => <JsonDocument source={content.content} path={target.path} onOpenExternally={onOpenExternally} />}
    </TextContentState>
  );
}
