import { useSettings } from "../../../settings";
import type { PreviewTarget } from "../../domain/entities/preview";
import { limitInBytes } from "../../domain/services/decide-preview";
import { usePreviewGateway } from "../context/PreviewContext";
import { usePreviewResource } from "./usePreviewResource";

type TextKind = "text" | "markdown" | "json" | "csv";

export function useTextContent(target: PreviewTarget, kind: TextKind) {
  const gateway = usePreviewGateway();
  const providers = useSettings((state) => state.settings.preview.providers);
  const maxBytes = limitInBytes(providers, kind);

  return usePreviewResource(`${kind}:${target.path}:${maxBytes}`, () =>
    gateway.readText(target.path, maxBytes),
  );
}
