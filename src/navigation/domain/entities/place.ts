export type PlaceKind =
  | "home"
  | "desktop"
  | "documents"
  | "downloads"
  | "pictures"
  | "music"
  | "videos"
  | "drive";

export interface Place {
  label: string;
  path: string;
  kind: PlaceKind;
}
