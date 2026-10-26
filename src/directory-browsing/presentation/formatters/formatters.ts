const SIZE_UNITS = ["B", "KB", "MB", "GB", "TB"];

export function formatFileSize(sizeInBytes: number): string {
  let value = sizeInBytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < SIZE_UNITS.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  const rounded = unitIndex === 0 || value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded} ${SIZE_UNITS[unitIndex]}`;
}

const modifiedFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatModifiedDate(modifiedAtMillis: number | null): string {
  return modifiedAtMillis === null ? "—" : modifiedFormatter.format(modifiedAtMillis);
}
