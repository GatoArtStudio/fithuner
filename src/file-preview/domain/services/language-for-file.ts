import { extensionOf } from "./detect-preview-kind";

const LANGUAGE_BY_EXTENSION: Record<string, string> = {
  rs: "rust", ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript",
  mjs: "javascript", cjs: "javascript", py: "python", go: "go", java: "java", kt: "kotlin",
  c: "c", h: "c", cpp: "cpp", cc: "cpp", hpp: "cpp", cs: "csharp", php: "php", rb: "ruby",
  sh: "bash", bash: "bash", zsh: "bash", ps1: "powershell", sql: "sql", yaml: "yaml", yml: "yaml",
  toml: "ini", ini: "ini", conf: "ini", xml: "xml", html: "xml", htm: "xml", vue: "xml",
  css: "css", scss: "scss", json: "json", lua: "lua", swift: "swift", dart: "dart",
};

const LANGUAGE_BY_FILE_NAME: Record<string, string> = {
  dockerfile: "dockerfile",
  makefile: "makefile",
};

export function languageForFile(name: string): string | null {
  return (
    LANGUAGE_BY_FILE_NAME[name.toLowerCase()] ?? LANGUAGE_BY_EXTENSION[extensionOf(name)] ?? null
  );
}
