import { useState } from "react";
import { usePreviewGateway } from "../../context/PreviewContext";
import { PreviewAction, PreviewMessage } from "../PreviewStates";
import type { ProviderProps } from "./ProviderProps";
import styles from "./ImagePreview.module.css";

export function ImagePreview({ target, onOpenExternally }: ProviderProps) {
  const gateway = usePreviewGateway();
  const [dimensions, setDimensions] = useState<string | null>(null);
  const [hasFailed, setHasFailed] = useState(false);

  if (hasFailed) {
    return (
      <PreviewMessage
        title="This image could not be displayed"
        detail="The file may be damaged or use an unsupported format."
        actions={<PreviewAction label="Open with default app" onClick={() => onOpenExternally(target.path)} />}
      />
    );
  }

  return (
    <div className={styles.frame}>
      <img
        className={styles.image}
        src={gateway.assetUrl(target.path)}
        alt={target.name}
        draggable={false}
        onLoad={(event) =>
          setDimensions(`${event.currentTarget.naturalWidth} × ${event.currentTarget.naturalHeight}`)
        }
        onError={() => setHasFailed(true)}
      />
      {dimensions && <span className={styles.dimensions}>{dimensions}</span>}
    </div>
  );
}
