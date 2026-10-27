import DOMPurify from "dompurify";
import { marked } from "marked";

const FORBIDDEN_TAGS = ["form", "input", "button", "textarea", "select", "style", "iframe", "object", "embed"];

export function renderMarkdown(source: string): string {
  const html = marked.parse(source, { async: false, gfm: true }) as string;
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true }, FORBID_TAGS: FORBIDDEN_TAGS });
}
