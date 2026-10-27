export type ClipboardIntent = "copy" | "cut";

export interface ClipboardFiles {
  paths: string[];
  intent: ClipboardIntent;
}
