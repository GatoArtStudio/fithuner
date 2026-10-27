import { useEffect, useState } from "react";

interface Detail {
  url: string;
  text: string;
}

function describeStatus(status: number): string {
  if (status === 403) return "Fithuner is not allowed to read this file (HTTP 403)";
  if (status === 404) return "The file could not be found (HTTP 404)";
  return `The file server answered HTTP ${status}`;
}

/** Explains why an asset could not be shown by asking the asset protocol for its first byte. */
export function useAssetFailureDetail(url: string, hasFailed: boolean): string | null {
  const [detail, setDetail] = useState<Detail | null>(null);

  useEffect(() => {
    if (!hasFailed) return;
    let isStale = false;
    fetch(url, { headers: { Range: "bytes=0-0" } }).then(
      (response) => {
        if (isStale) return;
        const text = response.ok
          ? "The file was read, but the browser could not decode it"
          : describeStatus(response.status);
        setDetail({ url, text });
      },
      (failure: unknown) => {
        if (isStale) return;
        const reason = failure instanceof Error ? failure.message : "unknown error";
        setDetail({ url, text: `The request was blocked (${reason})` });
      },
    );
    return () => {
      isStale = true;
    };
  }, [url, hasFailed]);

  return detail?.url === url ? detail.text : null;
}
