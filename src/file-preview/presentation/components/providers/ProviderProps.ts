import type { PreviewTarget } from "../../../domain/entities/preview";

export type PreviewVariant = "panel" | "quicklook";

export interface ProviderProps {
  target: PreviewTarget;
  variant: PreviewVariant;
  onOpenExternally: (path: string) => void;
}
