import { lazy, Suspense } from "react";
import { formatFileSize } from "../../../directory-browsing";
import { useSettings } from "../../../settings";
import type { PreviewDecision, PreviewKind, PreviewTarget } from "../../domain/entities/preview";
import { decidePreview } from "../../domain/services/decide-preview";
import { usePreview } from "../context/PreviewContext";
import { CsvPreview } from "./providers/CsvPreview";
import { ImagePreview } from "./providers/ImagePreview";
import { JsonPreview } from "./providers/JsonPreview";
import { MediaPreview } from "./providers/MediaPreview";
import type { PreviewVariant, ProviderProps } from "./providers/ProviderProps";
import { TextPreview } from "./providers/TextPreview";
import { PreviewAction, PreviewLoading, PreviewMessage } from "./PreviewStates";

const MarkdownPreview = lazy(() => import("./providers/MarkdownPreview"));

const KIND_LABELS: Record<PreviewKind, string> = {
  image: "images",
  text: "text files",
  markdown: "Markdown files",
  json: "JSON files",
  csv: "CSV files",
  pdf: "PDF files",
  audio: "audio files",
  video: "video files",
  folder: "folders",
  unsupported: "this type of file",
};

interface PreviewBodyProps {
  target: PreviewTarget;
  variant: PreviewVariant;
  onOpenExternally: (path: string) => void;
}

function renderProvider(kind: PreviewKind, props: ProviderProps) {
  switch (kind) {
    case "image":
      return <ImagePreview {...props} />;
    case "text":
      return <TextPreview {...props} />;
    case "markdown":
      return (
        <Suspense fallback={<PreviewLoading />}>
          <MarkdownPreview {...props} />
        </Suspense>
      );
    case "json":
      return <JsonPreview {...props} />;
    case "csv":
      return <CsvPreview {...props} />;
    case "audio":
      return <MediaPreview {...props} media="audio" />;
    case "video":
      return <MediaPreview {...props} media="video" />;
    default:
      return (
        <PreviewMessage
          title="No preview available"
          actions={<PreviewAction label="Open with default app" onClick={() => props.onOpenExternally(props.target.path)} />}
        />
      );
  }
}

export function PreviewBody({ target, variant, onOpenExternally }: PreviewBodyProps) {
  const previewSettings = useSettings((state) => state.settings.preview);
  const forcedPaths = usePreview((state) => state.forcedPaths);
  const forcePreview = usePreview((state) => state.forcePreview);

  const decision: PreviewDecision = decidePreview(target, previewSettings);
  const isForced =
    decision.type === "too-large" && decision.canForce && forcedPaths.includes(target.path);
  const openAction = (
    <PreviewAction label="Open with default app" onClick={() => onOpenExternally(target.path)} />
  );

  if (decision.type === "unsupported") {
    return <PreviewMessage title="No preview for this type of file" actions={target.kind === "file" ? openAction : undefined} />;
  }
  if (decision.type === "disabled") {
    return (
      <PreviewMessage
        title={`Preview is turned off for ${KIND_LABELS[decision.kind]}`}
        detail="You can turn it on in Settings > Preview."
        actions={target.kind === "file" ? openAction : undefined}
      />
    );
  }
  if (decision.type === "too-large" && !isForced) {
    return (
      <PreviewMessage
        title="This file is too large to preview"
        detail={`${formatFileSize(target.sizeInBytes)} is over the limit of ${formatFileSize(decision.limitBytes)}.`}
        actions={
          <>
            {decision.canForce && <PreviewAction label="Preview anyway" onClick={() => forcePreview(target.path)} />}
            {openAction}
          </>
        }
      />
    );
  }

  const kind = decision.type === "render" ? decision.kind : decision.kind;
  return renderProvider(kind, { target, variant, onOpenExternally });
}
