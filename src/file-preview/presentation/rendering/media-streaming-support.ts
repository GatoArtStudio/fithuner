/** Some web engines (WebKitGTK) cannot stream media from the asset protocol; once seen, later players skip that attempt. */
let assetStreamingUnsupported = false;

export function isAssetStreamingUnsupported(): boolean {
  return assetStreamingUnsupported;
}

export function markAssetStreamingUnsupported(): void {
  assetStreamingUnsupported = true;
}

export function resetAssetStreamingSupport(): void {
  assetStreamingUnsupported = false;
}
