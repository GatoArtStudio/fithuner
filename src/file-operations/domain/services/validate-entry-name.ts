const MAX_NAME_BYTES = 255;
const FORBIDDEN_CHARACTERS = /[/\\<>:"|?*]/;

function isControlCharacter(character: string): boolean {
  const code = character.charCodeAt(0);
  return code < 0x20 || code === 0x7f;
}

export function validateEntryName(name: string): string | null {
  if (name.trim() === "") return "The name cannot be empty";
  if (name === "." || name === "..") return 'The name cannot be "." or ".."';
  if (new TextEncoder().encode(name).length > MAX_NAME_BYTES) return "The name is too long";
  if ([...name].some(isControlCharacter)) return "The name cannot contain control characters";
  if (FORBIDDEN_CHARACTERS.test(name)) return 'The name cannot contain / \\ < > : " | ? *';
  if (name.endsWith(".") || name.endsWith(" ")) return "The name cannot end with a dot or a space";
  return null;
}

export function fileNameOf(path: string): string {
  return path.split(/[\\/]/).filter(Boolean).pop() ?? path;
}
