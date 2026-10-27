import { useState } from "react";
import { usePreviewGateway } from "../../context/PreviewContext";
import { PreviewAction, PreviewMessage } from "../PreviewStates";
import type { ProviderProps } from "./ProviderProps";
import styles from "./MediaPreview.module.css";

interface MediaPreviewProps extends ProviderProps {
  media: "audio" | "video";
}

export function MediaPreview({ target, media, onOpenExternally }: MediaPreviewProps) {
  const gateway = usePreviewGateway();
  const [hasFailed, setHasFailed] = useState(false);

  if (hasFailed) {
    return (
      <PreviewMessage
        title={`This ${media} file cannot be played here`}
        detail="Your system may be missing the codec for this format."
        actions={<PreviewAction label="Open with default app" onClick={() => onOpenExternally(target.path)} />}
      />
    );
  }

  const url = gateway.assetUrl(target.path);

  return (
    <div className={styles.frame}>
      {media === "video" ? (
        <video className={styles.video} src={url} controls preload="metadata" onError={() => setHasFailed(true)} />
      ) : (
        <>
          <p className={styles.audioName}>{target.name}</p>
          <audio className={styles.audio} src={url} controls preload="metadata" onError={() => setHasFailed(true)} />
        </>
      )}
    </div>
  );
}
