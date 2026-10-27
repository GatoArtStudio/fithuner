import type { ContextMenuItem } from "../../../shared/components/ContextMenu";
import { useFileClipboard } from "../context/FileClipboardContext";

export interface ClipboardMenuTarget {
  path: string;
  kind: "file" | "directory";
}

export function useClipboardMenuItems(): (target: ClipboardMenuTarget | null) => ContextMenuItem[] {
  const copySelected = useFileClipboard((state) => state.copySelected);
  const cutSelected = useFileClipboard((state) => state.cutSelected);
  const paste = useFileClipboard((state) => state.paste);

  return (target) => {
    if (!target) return [{ label: "Paste", shortcut: "Ctrl+V", onSelect: () => void paste() }];

    const items: ContextMenuItem[] = [
      { label: "Cut", shortcut: "Ctrl+X", onSelect: () => void cutSelected() },
      { label: "Copy", shortcut: "Ctrl+C", onSelect: () => void copySelected() },
    ];
    items.push(
      target.kind === "directory"
        ? { label: "Paste into folder", onSelect: () => void paste(target.path) }
        : { label: "Paste", shortcut: "Ctrl+V", onSelect: () => void paste() },
    );
    return items;
  };
}
