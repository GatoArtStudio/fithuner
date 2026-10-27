import type { ClipboardFiles, ClipboardIntent } from "../../domain/entities/clipboard";

export interface FileClipboardGateway {
  placeFiles(paths: string[], intent: ClipboardIntent): Promise<void>;
  readFiles(): Promise<ClipboardFiles>;
  clearCutMarker(): Promise<void>;
}
