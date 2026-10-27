import type { ReactNode } from "react";
import type { TextPreviewResult } from "../../../application/ports/preview-gateway";
import type { PreviewTarget } from "../../../domain/entities/preview";
import { useTextContent } from "../../hooks/useTextContent";
import { PreviewAction, PreviewLoading, PreviewMessage } from "../PreviewStates";

interface TextContentStateProps {
  target: PreviewTarget;
  kind: "text" | "markdown" | "json" | "csv";
  onOpenExternally: (path: string) => void;
  children: (content: TextPreviewResult) => ReactNode;
}

export function TextContentState({ target, kind, onOpenExternally, children }: TextContentStateProps) {
  const resource = useTextContent(target, kind);
  const openAction = <PreviewAction label="Open with default app" onClick={() => onOpenExternally(target.path)} />;

  if (resource.status === "error") {
    return <PreviewMessage title="This file cannot be previewed" detail={resource.message} actions={openAction} />;
  }
  if (resource.status !== "ready") return <PreviewLoading />;
  if (resource.data === null) {
    return (
      <PreviewMessage
        title="This file does not look like text"
        detail="It seems to contain binary data."
        actions={openAction}
      />
    );
  }
  return <>{children(resource.data)}</>;
}
