export type JsonValueKind = "object" | "array" | "string" | "number" | "boolean" | "null";

export function jsonKindOf(value: unknown): JsonValueKind {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  return "boolean";
}

export function jsonChildren(value: unknown): [string, unknown][] {
  if (Array.isArray(value)) return value.map((item, index) => [String(index), item]);
  if (value !== null && typeof value === "object") return Object.entries(value);
  return [];
}

export function describeJsonContainer(value: unknown): string {
  const count = jsonChildren(value).length;
  return Array.isArray(value) ? `[${count}]` : `{${count}}`;
}
