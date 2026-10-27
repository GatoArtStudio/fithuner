import type { SearchStatus } from "../entities/search";

const numberFormat = new Intl.NumberFormat("en");

export function describeSearchStatus(status: SearchStatus, shownCount: number): string {
  const count = numberFormat.format(shownCount);
  switch (status.type) {
    case "idle":
      return "Type to search this folder and its subfolders";
    case "searching":
      return `Searching… ${count} ${shownCount === 1 ? "result" : "results"}`;
    case "error":
      return status.error.message;
    case "done":
      if (status.summary.isTruncated) return `${count}+ results (showing the first ${count})`;
      if (shownCount === 0) return "No results";
      return `${count} ${shownCount === 1 ? "result" : "results"}`;
  }
}
