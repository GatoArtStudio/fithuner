import { ContextMenu, type ContextMenuItem } from "../../../shared/components/ContextMenu";
import { useFileOperations } from "../context/FileOperationsContext";

export function EntryContextMenu() {
  const request = useFileOperations((state) => state.contextMenu);
  const close = useFileOperations((state) => state.closeContextMenu);
  const openEntry = useFileOperations((state) => state.openEntry);
  const createEntry = useFileOperations((state) => state.createEntry);
  const startRename = useFileOperations((state) => state.startRename);
  const trashSelected = useFileOperations((state) => state.trashSelected);
  const requestPermanentDelete = useFileOperations((state) => state.requestPermanentDelete);

  if (!request) return null;

  const creationItems: ContextMenuItem[] = [
    { label: "New folder", shortcut: "Ctrl+Shift+N", onSelect: () => void createEntry("directory") },
    { label: "New file", shortcut: "Ctrl+Alt+N", onSelect: () => void createEntry("file") },
  ];

  const { target } = request;
  const items: ContextMenuItem[] = target
    ? [
        ...(target.kind === "file"
          ? [{ label: "Open", shortcut: "Enter", onSelect: () => void openEntry(target.path) }]
          : []),
        { label: "Rename", shortcut: "F2", onSelect: () => startRename(target.path) },
        { label: "Move to trash", shortcut: "Delete", onSelect: () => void trashSelected() },
        {
          label: "Delete permanently",
          shortcut: "Shift+Delete",
          isDanger: true,
          onSelect: requestPermanentDelete,
        },
        "separator",
        ...creationItems,
      ]
    : creationItems;

  return <ContextMenu x={request.x} y={request.y} items={items} onClose={close} />;
}
