import { invoke } from "@tauri-apps/api/core";
import type { FileClipboardGateway } from "../../../application/ports/file-clipboard-gateway";
import type { ClipboardFiles } from "../../../domain/entities/clipboard";

export const tauriFileClipboardGateway: FileClipboardGateway = {
  placeFiles: (paths, intent) => invoke<void>("copy_files_to_clipboard", { paths, intent }),
  readFiles: () => invoke<ClipboardFiles>("read_clipboard_files"),
  clearCutMarker: () => invoke<void>("clear_cut_marker"),
};
