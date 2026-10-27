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
  const [isPlayerShown, setIsPlayerShown] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  if (hasFailed) {
    return (
      <PreviewMessage
        title={`This ${media} file cannot be played here`}
        detail="Your system may be missing the media codecs. On Linux, install the GStreamer plugins (base, good and libav)."
        actions={<PreviewAction label="Open with default app" onClick={() => onOpenExternally(target.path)} />}
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

  const url = gateway.assetUrl(target.path);

  return (
    <div className={styles.frame}>
      {media === "video" ? (
        <video className={styles.video} src={url} crossOrigin="anonymous" controls autoPlay onError={() => setHasFailed(true)} />
      ) : (
        <>
          <p className={styles.audioName}>{target.name}</p>
          <audio className={styles.audio} src={url} crossOrigin="anonymous" controls autoPlay onError={() => setHasFailed(true)} />
        </>
      )}
    </div>
  );
}
