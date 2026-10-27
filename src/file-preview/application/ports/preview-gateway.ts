export interface TextPreviewResult {
  content: string;
  isTruncated: boolean;
  totalBytes: number;
}

export interface FolderSummaryResult {
  fileCount: number;
  folderCount: number;
  totalBytes: number;
  isPartial: boolean;
}

export interface PreviewGateway {
  readText(path: string, maxBytes: number): Promise<TextPreviewResult | null>;
  summarizeFolder(path: string): Promise<FolderSummaryResult>;
  assetUrl(path: string): string;
}
