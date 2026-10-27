import { useEffect, useState, type SyntheticEvent } from "react";
import { formatFileSize } from "../../../../directory-browsing";
import { usePreviewGateway } from "../../context/PreviewContext";
import { usePreviewResource } from "../../hooks/usePreviewResource";
import { describeMediaError } from "../../rendering/describe-media-error";
import {
  isAssetStreamingUnsupported,
  markAssetStreamingUnsupported,
} from "../../rendering/media-streaming-support";
import { PreviewAction, PreviewLoading, PreviewMessage } from "../PreviewStates";
import type { ProviderProps } from "./ProviderProps";
import styles from "./MediaPreview.module.css";

export const MEDIA_MEMORY_FALLBACK_LIMIT_BYTES = 256 * 1024 * 1024;

interface MediaPreviewProps extends ProviderProps {
  media: "audio" | "video";
}

export function MediaPreview({ target, media, onOpenExternally }: MediaPreviewProps) {
  const gateway = usePreviewGateway();
  const assetUrl = gateway.assetUrl(target.path);
  const canUseMemoryFallback = target.sizeInBytes <= MEDIA_MEMORY_FALLBACK_LIMIT_BYTES;

  const [isPlayerShown, setIsPlayerShown] = useState(false);
  const [source, setSource] = useState<"asset" | "memory">(
    isAssetStreamingUnsupported() && canUseMemoryFallback ? "memory" : "asset",
  );
  const [failureDetail, setFailureDetail] = useState<string | null>(null);

  const memoryCopy = usePreviewResource(source === "memory" ? `media-memory:${target.path}` : null, async () => {
    const response = await fetch(assetUrl);
    if (!response.ok) throw new Error(`The file could not be read (HTTP ${response.status})`);
    return URL.createObjectURL(await response.blob());
  });
  const memoryUrl = memoryCopy.status === "ready" ? memoryCopy.data : null;

  useEffect(() => {
    if (memoryUrl === null) return;
    return () => URL.revokeObjectURL(memoryUrl);
  }, [memoryUrl]);

  function handleError(event: SyntheticEvent<HTMLMediaElement>) {
    if (source === "asset" && canUseMemoryFallback) {
      markAssetStreamingUnsupported();
      setSource("memory");
      return;
    }
    setFailureDetail(describeMediaError(event.currentTarget.error));
  }

  const openAction = <PreviewAction label="Open with default app" onClick={() => onOpenExternally(target.path)} />;

  if (source === "asset" && !canUseMemoryFallback && failureDetail !== null) {
    return (
      <PreviewMessage
        title={`This ${media} file cannot be played here`}
        detail={`${failureDetail}. It is also too large (${formatFileSize(target.sizeInBytes)}) to load in memory.`}
        actions={openAction}
      />
    );
  }
  if (failureDetail !== null || memoryCopy.status === "error") {
    return (
      <PreviewMessage
        title={`This ${media} file cannot be played here`}
        detail={`${failureDetail ?? (memoryCopy.status === "error" ? memoryCopy.message : "")}. On Linux this can also mean a missing GStreamer plugin (base, good, bad, libav).`}
        actions={openAction}
      />
    );
  }

  if (!isPlayerShown) {
    return (
      <div className={styles.frame}>
        <p className={styles.audioName}>{target.name}</p>
        <button type="button" className={styles.play} onClick={() => setIsPlayerShown(true)}>
          Play {media}
        </button>
        <p className={styles.hint}>The player only starts when you ask for it.</p>
      </div>
    );
  }

  if (source === "memory" && memoryUrl === null) return <PreviewLoading />;

  const playerProps = {
    src: source === "memory" ? (memoryUrl ?? undefined) : assetUrl,
    crossOrigin: source === "asset" ? ("anonymous" as const) : undefined,
    controls: true,
    autoPlay: true,
    onError: handleError,
  };

  return (
    <div className={styles.frame}>
      {media === "video" ? (
        <video className={styles.video} {...playerProps} />
      ) : (
        <>
          <p className={styles.audioName}>{target.name}</p>
          <audio className={styles.audio} {...playerProps} />
        </>
      )}
    </div>
  );
}
