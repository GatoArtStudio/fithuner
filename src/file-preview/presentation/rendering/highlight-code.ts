import type { LanguageFn } from "highlight.js";
import hljs from "highlight.js/lib/core";

const MAX_HIGHLIGHTED_CHARACTERS = 300_000;

type LanguageModule = { default: LanguageFn };

const LANGUAGE_LOADERS: Record<string, () => Promise<LanguageModule>> = {
  bash: () => import("highlight.js/lib/languages/bash"),
  c: () => import("highlight.js/lib/languages/c"),
  cpp: () => import("highlight.js/lib/languages/cpp"),
  csharp: () => import("highlight.js/lib/languages/csharp"),
  css: () => import("highlight.js/lib/languages/css"),
  dart: () => import("highlight.js/lib/languages/dart"),
  dockerfile: () => import("highlight.js/lib/languages/dockerfile"),
  go: () => import("highlight.js/lib/languages/go"),
  ini: () => import("highlight.js/lib/languages/ini"),
  java: () => import("highlight.js/lib/languages/java"),
  javascript: () => import("highlight.js/lib/languages/javascript"),
  json: () => import("highlight.js/lib/languages/json"),
  kotlin: () => import("highlight.js/lib/languages/kotlin"),
  lua: () => import("highlight.js/lib/languages/lua"),
  makefile: () => import("highlight.js/lib/languages/makefile"),
  php: () => import("highlight.js/lib/languages/php"),
  powershell: () => import("highlight.js/lib/languages/powershell"),
  python: () => import("highlight.js/lib/languages/python"),
  ruby: () => import("highlight.js/lib/languages/ruby"),
  rust: () => import("highlight.js/lib/languages/rust"),
  scss: () => import("highlight.js/lib/languages/scss"),
  sql: () => import("highlight.js/lib/languages/sql"),
  swift: () => import("highlight.js/lib/languages/swift"),
  typescript: () => import("highlight.js/lib/languages/typescript"),
  xml: () => import("highlight.js/lib/languages/xml"),
  yaml: () => import("highlight.js/lib/languages/yaml"),
};

const registeredLanguages = new Set<string>();

export async function highlightCode(code: string, language: string | null): Promise<string | null> {
  if (!language || code.length > MAX_HIGHLIGHTED_CHARACTERS) return null;
  const loadLanguage = LANGUAGE_LOADERS[language];
  if (!loadLanguage) return null;

  if (!registeredLanguages.has(language)) {
    hljs.registerLanguage(language, (await loadLanguage()).default);
    registeredLanguages.add(language);
  }
  return hljs.highlight(code, { language, ignoreIllegals: true }).value;
}
