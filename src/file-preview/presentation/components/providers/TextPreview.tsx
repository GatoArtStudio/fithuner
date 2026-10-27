import { useEffect, useState } from "react";
import { languageForFile } from "../../../domain/services/language-for-file";
import { highlightCode } from "../../rendering/highlight-code";
import type { ProviderProps } from "./ProviderProps";
import { TextContentState } from "./TextContentState";
import { TruncationNotice } from "./TruncationNotice";
import styles from "./TextPreview.module.css";

interface HighlightedCodeProps {
  content: string;
  fileName: string;
}

function HighlightedCode({ content, fileName }: HighlightedCodeProps) {
  const [highlighted, setHighlighted] = useState<{ source: string; html: string | null } | null>(null);

  useEffect(() => {
    let isStale = false;
    highlightCode(content, languageForFile(fileName)).then((html) => {
      if (!isStale) setHighlighted({ source: content, html });
    }, () => {
      if (!isStale) setHighlighted({ source: content, html: null });
    });
    return () => {
      isStale = true;
    };
  }, [content, fileName]);

  const html = highlighted?.source === content ? highlighted.html : null;

  return html === null ? (
    <pre className={styles.code}>{content}</pre>
  ) : (
    <pre className={styles.code} dangerouslySetInnerHTML={{ __html: html }} />
  );
}

export function TextPreview({ target, onOpenExternally }: ProviderProps) {
  return (
    <TextContentState target={target} kind="text" onOpenExternally={onOpenExternally}>
      {(content) => (
        <div className={styles.frame}>
          <TruncationNotice content={content} />
          {content.content === "" ? (
            <p className={styles.empty}>This file is empty.</p>
          ) : (
            <HighlightedCode content={content.content} fileName={target.name} />
          )}
        </div>
      )}
    </TextContentState>
  );
}
