import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import type {
  FolderSummaryResult,
  PreviewGateway,
  TextPreviewResult,
} from "../../../application/ports/preview-gateway";

export const tauriPreviewGateway: PreviewGateway = {
  readText: (path, maxBytes) => invoke<TextPreviewResult | null>("read_text_preview", { path, maxBytes }),
  summarizeFolder: (path) => invoke<FolderSummaryResult>("summarize_folder", { path }),
  assetUrl: (path) => convertFileSrc(path),
};
