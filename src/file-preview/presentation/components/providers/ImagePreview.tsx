import { useState } from "react";
import { usePreviewGateway } from "../../context/PreviewContext";
import { useAssetFailureDetail } from "../../hooks/useAssetFailureDetail";
import { useImageViewport } from "../../hooks/useImageViewport";
import { PreviewAction, PreviewMessage } from "../PreviewStates";
import type { ProviderProps } from "./ProviderProps";
import styles from "./ImagePreview.module.css";

export function ImagePreview({ target, variant, onOpenExternally }: ProviderProps) {
  const gateway = usePreviewGateway();
  const [dimensions, setDimensions] = useState<string | null>(null);
  const [hasFailed, setHasFailed] = useState(false);
  const { frameRef, imageRef, frameProps, viewport, isPanning, reset } = useImageViewport();
  const url = gateway.assetUrl(target.path);
  const failureDetail = useAssetFailureDetail(url, hasFailed);
  const isZoomed = viewport.scale !== 1;

  if (hasFailed) {
    return (
      <PreviewMessage
        title="This image could not be displayed"
        detail={failureDetail ?? "Checking what went wrong…"}
        actions={<PreviewAction label="Open with default app" onClick={() => onOpenExternally(target.path)} />}
      />
    );
  }

  return (
    <div
      ref={frameRef}
      className={styles.frame}
      data-panning={isPanning}
      data-zoomed={isZoomed}
      {...frameProps}
    >
      <img
        ref={imageRef}
        className={styles.image}
        style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})` }}
        src={url}
        crossOrigin="anonymous"
        alt={target.name}
        draggable={false}
        onLoad={(event) =>
          setDimensions(`${event.currentTarget.naturalWidth} × ${event.currentTarget.naturalHeight}`)
        }
        onError={() => setHasFailed(true)}
      />
      <div className={styles.status} onPointerDown={(event) => event.stopPropagation()} onDoubleClick={(event) => event.stopPropagation()}>
        {variant === "quicklook" && !isZoomed && <span>Scroll to zoom · drag to move</span>}
        {isZoomed && (
          <>
            <span>{Math.round(viewport.scale * 100)}%</span>
            <button type="button" className={styles.fit} onClick={reset}>
              Fit
            </button>
          </>
        )}
        {dimensions && <span>{dimensions}</span>}
      </div>
    </div>
  );
}
