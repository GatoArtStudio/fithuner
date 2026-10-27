import type { PreviewProvidersSettings, PreviewSettings } from "../../../settings";
import type { PreviewDecision, PreviewKind, PreviewTarget } from "../entities/preview";
import { detectPreviewKind } from "./detect-preview-kind";

const BYTES_PER_MEGABYTE = 1024 * 1024;
const FORCEABLE_KINDS: PreviewKind[] = ["image", "pdf"];

type SizedKind = "image" | "text" | "markdown" | "json" | "csv" | "pdf";

function isSizedKind(kind: PreviewKind): kind is SizedKind {
  return ["image", "text", "markdown", "json", "csv", "pdf"].includes(kind);
}

export function limitInBytes(providers: PreviewProvidersSettings, kind: SizedKind): number {
  return providers[kind].maxSizeMegabytes * BYTES_PER_MEGABYTE;
}

export function decidePreview(target: PreviewTarget, preview: PreviewSettings): PreviewDecision {
  const kind = detectPreviewKind(target);
  if (kind === "unsupported") return { type: "unsupported" };
  if (!preview.providers[kind].enabled) return { type: "disabled", kind };

  if (isSizedKind(kind) && kind !== "text") {
    const limitBytes = limitInBytes(preview.providers, kind);
    if (target.sizeInBytes > limitBytes) {
      return { type: "too-large", kind, limitBytes, canForce: FORCEABLE_KINDS.includes(kind) };
    }
  }
  return { type: "render", kind };
}
