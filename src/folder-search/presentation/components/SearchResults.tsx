import { forwardRef, useEffect, useImperativeHandle, useRef, type KeyboardEvent } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { formatFileSize, formatModifiedDate } from "../../../directory-browsing";
import { Icon } from "../../../shared/icons/Icon";
import type { SearchMatch } from "../../domain/entities/search";
import { useSearch } from "../context/SearchContext";
import { HighlightedName } from "./HighlightedName";
import styles from "./SearchResults.module.css";

const ROW_HEIGHT = 38;

export interface SearchResultsHandle {
  focus: () => void;
}

interface SearchResultsProps {
  onOpenMatch: (match: SearchMatch) => void;
  onShowInFolder: (match: SearchMatch) => void;
  onQuickLook?: (match: SearchMatch) => void;
}

export const SearchResults = forwardRef<SearchResultsHandle, SearchResultsProps>(function SearchResults(
  { onOpenMatch, onShowInFolder, onQuickLook },
  ref,
) {
  const matches = useSearch((state) => state.matches);
  const text = useSearch((state) => state.text);
  const selectedPath = useSearch((state) => state.selectedPath);
  const status = useSearch((state) => state.status);
  const select = useSearch((state) => state.select);
  const moveSelection = useSearch((state) => state.moveSelection);
  const close = useSearch((state) => state.close);
  const scrollRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({ focus: () => scrollRef.current?.focus() }));

  const virtualizer = useVirtualizer({
    count: matches.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
  });

  useEffect(() => {
    const index = matches.findIndex((found) => found.path === selectedPath);
    if (index !== -1) virtualizer.scrollToIndex(index);
  }, [selectedPath, matches, virtualizer]);

  function selectedMatch(): SearchMatch | undefined {
    return matches.find((found) => found.path === selectedPath);
  }

  function handleKeyDown(event: KeyboardEvent) {
    const current = selectedMatch();
    switch (event.key) {
      case "ArrowDown":
        moveSelection(1);
        break;
      case "ArrowUp":
        moveSelection(-1);
        break;
      case "Home":
        moveSelection(-matches.length);
        break;
      case "End":
        moveSelection(matches.length);
        break;
      case "Enter":
        if (!current) return;
        if (event.ctrlKey || event.metaKey) onShowInFolder(current);
        else onOpenMatch(current);
        break;
      case " ":
        if (!current || !onQuickLook) return;
        onQuickLook(current);
        break;
      case "Escape":
        close();
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  return (
    <div className={styles.container}>
      <div className={styles.header} role="row">
        <span>Name</span>
        <span>Folder</span>
        <span>Size</span>
        <span>Modified</span>
      </div>
      <div
        ref={scrollRef}
        className={styles.scrollArea}
        role="listbox"
        aria-label="Search results"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {matches.length === 0 && status.type !== "searching" && (
          <p className={styles.empty}>{text.trim() === "" ? "Results appear here as you type" : "Nothing found"}</p>
        )}
        <div className={styles.rows} style={{ height: virtualizer.getTotalSize() }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const found = matches[virtualRow.index];
            const isSelected = found.path === selectedPath;
            return (
              <div
                key={found.path}
                role="option"
                aria-selected={isSelected}
                className={`${styles.row} ${isSelected ? styles.selected : ""}`}
                style={{ height: ROW_HEIGHT, transform: `translateY(${virtualRow.start}px)` }}
                onClick={() => select(found.path)}
                onDoubleClick={() => onOpenMatch(found)}
              >
                <span className={styles.name}>
                  <Icon name={found.kind === "directory" ? "folder" : "file"} className={found.kind === "directory" ? styles.folderIcon : styles.fileIcon} />
                  <span className={styles.nameText}>
                    <HighlightedName name={found.name} query={text} />
                  </span>
                </span>
                <span className={styles.secondary} title={found.relativeFolder}>
                  {found.relativeFolder || "—"}
                </span>
                <span className={styles.secondary}>{found.kind === "directory" ? "" : formatFileSize(found.sizeInBytes)}</span>
                <span className={styles.secondary}>{formatModifiedDate(found.modifiedAtMillis)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
