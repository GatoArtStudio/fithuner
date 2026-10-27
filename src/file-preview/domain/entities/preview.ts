export type PreviewKind =
  | "image"
  | "text"
  | "markdown"
  | "json"
  | "csv"
  | "pdf"
  | "audio"
  | "video"
  | "folder"
  | "unsupported";

export interface PreviewTarget {
  path: string;
  name: string;
  kind: "file" | "directory";
  sizeInBytes: number;
  modifiedAtMillis: number | null;
}

export type PreviewDecision =
  | { type: "render"; kind: PreviewKind }
  | { type: "disabled"; kind: PreviewKind }
  | { type: "too-large"; kind: PreviewKind; limitBytes: number; canForce: boolean }
  | { type: "unsupported" };
