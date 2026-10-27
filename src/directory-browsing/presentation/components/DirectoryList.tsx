import { useEffect, useMemo, useRef, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Icon } from "../../../shared/icons/Icon";
import type { FileEntry } from "../../domain/entities/file-entry";
import {
  fileExtension,
  filterVisibleEntries,
  sortEntries,
  type SortKey,
} from "../../domain/services/sort-entries";
import { useDirectoryBrowsing } from "../context/DirectoryBrowsingContext";
import { formatFileSize, formatModifiedDate } from "../formatters/formatters";
import styles from "./DirectoryList.module.css";

const ROW_HEIGHT = 34;

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "modified", label: "Modified" },
  { key: "type", label: "Type" },
  { key: "size", label: "Size" },
];

function describeType(entry: FileEntry): string {
  if (entry.kind === "directory") return "Folder";
  const extension = fileExtension(entry);
  return extension ? `${extension.toUpperCase()} file` : "File";
}

export interface ContextMenuPosition {
  x: number;
  y: number;
}

interface DirectoryListProps {
  onOpenEntry: (entry: FileEntry) => void;
  onContextMenu: (entry: FileEntry | null, position: ContextMenuPosition) => void;
  renderNameEditor?: (entry: FileEntry) => ReactNode;
  isEntryDimmed?: (entry: FileEntry) => boolean;
}

export function DirectoryList({
  onOpenEntry,
  onContextMenu,
  renderNameEditor,
  isEntryDimmed,
}: DirectoryListProps) {
  const listing = useDirectoryBrowsing((state) => state.listing);
  const error = useDirectoryBrowsing((state) => state.error);
  const sort = useDirectoryBrowsing((state) => state.sort);
  const showHidden = useDirectoryBrowsing((state) => state.showHidden);
  const selectedPaths = useDirectoryBrowsing((state) => state.selectedPaths);
  const toggleSort = useDirectoryBrowsing((state) => state.toggleSort);
  const selectOnly = useDirectoryBrowsing((state) => state.selectOnly);
  const toggleSelection = useDirectoryBrowsing((state) => state.toggleSelection);
  const clearSelection = useDirectoryBrowsing((state) => state.clearSelection);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const visibleEntries = useMemo(
    () => sortEntries(filterVisibleEntries(listing?.entries ?? [], showHidden), sort),
    [listing, showHidden, sort],
  );
  const selectedPathSet = useMemo(() => new Set(selectedPaths), [selectedPaths]);

  // TanStack Virtual returns unmemoizable functions; the compiler skipping this component is expected
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: visibleEntries.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
  });

  const lastSelectedPath = selectedPaths[selectedPaths.length - 1];

  useEffect(() => {
    if (!lastSelectedPath) return;
    const index = visibleEntries.findIndex((entry) => entry.path === lastSelectedPath);
    if (index !== -1) virtualizer.scrollToIndex(index);
  }, [lastSelectedPath, visibleEntries, virtualizer]);

  function handleRowContextMenu(event: MouseEvent, entry: FileEntry) {
    event.preventDefault();
    event.stopPropagation();
    if (!selectedPathSet.has(entry.path)) selectOnly(entry.path);
    onContextMenu(entry, { x: event.clientX, y: event.clientY });
  }

  function handleBlankAreaContextMenu(event: MouseEvent) {
    event.preventDefault();
    clearSelection();
    onContextMenu(null, { x: event.clientX, y: event.clientY });
  }

  function handleRowClick(event: MouseEvent, entry: FileEntry) {
    if (event.ctrlKey || event.metaKey) toggleSelection(entry.path);
    else selectOnly(entry.path);
  }

  function moveSelectionTo(index: number) {
    const target = visibleEntries[Math.max(0, Math.min(index, visibleEntries.length - 1))];
    if (!target) return;
    selectOnly(target.path);
  }

  function openContextMenuFromKeyboard(entry: FileEntry | null) {
    const bounds = scrollContainerRef.current?.getBoundingClientRect();
    onContextMenu(entry, { x: (bounds?.left ?? 0) + 48, y: (bounds?.top ?? 0) + 48 });
  }

  function handleKeyDown(event: KeyboardEvent) {
    const lastSelectedPath = selectedPaths[selectedPaths.length - 1];
    const currentIndex = visibleEntries.findIndex((entry) => entry.path === lastSelectedPath);

    switch (event.key) {
      case "ArrowDown":
        moveSelectionTo(currentIndex + 1);
        break;
      case "ArrowUp":
        moveSelectionTo(currentIndex === -1 ? 0 : currentIndex - 1);
        break;
      case "Home":
        moveSelectionTo(0);
        break;
      case "End":
        moveSelectionTo(visibleEntries.length - 1);
        break;
      case "Enter":
        if (currentIndex !== -1) onOpenEntry(visibleEntries[currentIndex]);
        break;
      case "ContextMenu":
        openContextMenuFromKeyboard(visibleEntries[currentIndex] ?? null);
        break;
      case "F10":
        if (!event.shiftKey) return;
        openContextMenuFromKeyboard(visibleEntries[currentIndex] ?? null);
        break;
      case "Escape":
        clearSelection();
        return;
      default:
        return;
    }
    event.preventDefault();
  }

  return (
    <div className={styles.container}>
      {error && (
        <div className={styles.errorBanner} role="alert">
          {error.message}
        </div>
      )}

      <div className={styles.header} role="row">
        {COLUMNS.map((column) => (
          <button
            key={column.key}
            type="button"
            className={styles.headerCell}
            onClick={() => toggleSort(column.key)}
          >
            {column.label}
            {sort.key === column.key && (
              <Icon
                name={sort.direction === "ascending" ? "sortAscending" : "sortDescending"}
                size={14}
              />
            )}
          </button>
        ))}
      </div>

      <div
        ref={scrollContainerRef}
        className={styles.scrollArea}
        role="listbox"
        aria-multiselectable="true"
        aria-label="Folder contents"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onClick={(event) => {
          if (event.target === event.currentTarget) clearSelection();
        }}
        onContextMenu={handleBlankAreaContextMenu}
      >
        {listing && visibleEntries.length === 0 && (
          <p className={styles.emptyState}>This folder is empty</p>
        )}

        <div className={styles.rows} style={{ height: virtualizer.getTotalSize() }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const entry = visibleEntries[virtualRow.index];
            const isSelected = selectedPathSet.has(entry.path);
            return (
              <div
                key={entry.path}
                role="option"
                aria-selected={isSelected}
                className={`${styles.row} ${isSelected ? styles.selected : ""} ${
                  entry.isHidden ? styles.hidden : ""
                } ${isEntryDimmed?.(entry) ? styles.dimmed : ""}`}
                style={{ height: ROW_HEIGHT, transform: `translateY(${virtualRow.start}px)` }}
                onClick={(event) => handleRowClick(event, entry)}
                onContextMenu={(event) => handleRowContextMenu(event, entry)}
                onDoubleClick={() => onOpenEntry(entry)}
              >
                <span className={styles.nameCell}>
                  <Icon
                    name={entry.kind === "directory" ? "folder" : "file"}
                    className={entry.kind === "directory" ? styles.folderIcon : styles.fileIcon}
                  />
                  {renderNameEditor?.(entry) ?? <span className={styles.name}>{entry.name}</span>}
                </span>
                <span className={styles.secondaryCell}>
                  {formatModifiedDate(entry.modifiedAtMillis)}
                </span>
                <span className={styles.secondaryCell}>{describeType(entry)}</span>
                <span className={styles.secondaryCell}>
                  {entry.kind === "directory" ? "" : formatFileSize(entry.sizeInBytes)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
