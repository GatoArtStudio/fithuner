import { useMemo, type MouseEvent } from "react";
import { renderMarkdown } from "../../rendering/render-markdown";
import type { ProviderProps } from "./ProviderProps";
import { TextContentState } from "./TextContentState";
import { TruncationNotice } from "./TruncationNotice";
import styles from "./MarkdownPreview.module.css";

function MarkdownDocument({ source }: { source: string }) {
  const html = useMemo(() => renderMarkdown(source), [source]);

  function ignoreLinkNavigation(event: MouseEvent) {
    if ((event.target as HTMLElement).closest("a")) event.preventDefault();
  }

  return (
    <article
      className={styles.markdown}
      onClick={ignoreLinkNavigation}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default function MarkdownPreview({ target, onOpenExternally }: ProviderProps) {
  return (
    <TextContentState target={target} kind="markdown" onOpenExternally={onOpenExternally}>
      {(content) => (
        <>
          <TruncationNotice content={content} />
          <MarkdownDocument source={content.content} />
        </>
      )}
    </TextContentState>
  );
}
