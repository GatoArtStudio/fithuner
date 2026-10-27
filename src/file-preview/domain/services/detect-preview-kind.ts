import type { PreviewKind, PreviewTarget } from "../entities/preview";

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico", "avif"];
const AUDIO_EXTENSIONS = ["mp3", "wav", "ogg", "oga", "flac", "m4a", "aac", "opus"];
const VIDEO_EXTENSIONS = ["mp4", "webm", "mkv", "mov", "ogv", "m4v"];
const MARKDOWN_EXTENSIONS = ["md", "markdown", "mdx"];
const JSON_EXTENSIONS = ["json", "geojson", "webmanifest"];
const CSV_EXTENSIONS = ["csv", "tsv"];
const UNSUPPORTED_EXTENSIONS = [
  "zip", "tar", "gz", "bz2", "xz", "7z", "rar", "zst",
  "exe", "dll", "so", "dylib", "bin", "o", "a", "class", "jar", "apk",
  "iso", "dmg", "img", "deb", "rpm", "msi",
  "doc", "docx", "xls", "xlsx", "ppt", "pptx", "odt", "ods", "odp",
  "woff", "woff2", "ttf", "otf", "eot",
  "db", "sqlite", "psd", "ai",
];

const EXTENSION_KINDS = new Map<string, PreviewKind>([
  ...IMAGE_EXTENSIONS.map((extension) => [extension, "image"] as const),
  ...AUDIO_EXTENSIONS.map((extension) => [extension, "audio"] as const),
  ...VIDEO_EXTENSIONS.map((extension) => [extension, "video"] as const),
  ...MARKDOWN_EXTENSIONS.map((extension) => [extension, "markdown"] as const),
  ...JSON_EXTENSIONS.map((extension) => [extension, "json"] as const),
  ...CSV_EXTENSIONS.map((extension) => [extension, "csv"] as const),
  ["pdf", "pdf"],
  ...UNSUPPORTED_EXTENSIONS.map((extension) => [extension, "unsupported"] as const),
]);

export function extensionOf(name: string): string {
  const dotIndex = name.lastIndexOf(".");
  return dotIndex > 0 ? name.slice(dotIndex + 1).toLowerCase() : "";
}

export function detectPreviewKind(target: Pick<PreviewTarget, "name" | "kind">): PreviewKind {
  if (target.kind === "directory") return "folder";
  return EXTENSION_KINDS.get(extensionOf(target.name)) ?? "text";
}
