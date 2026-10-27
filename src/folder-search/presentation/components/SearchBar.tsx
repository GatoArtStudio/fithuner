import { useEffect, useRef, type KeyboardEvent } from "react";
import { Icon } from "../../../shared/icons/Icon";
import { SEARCH_KIND_FILTERS, type SearchKindFilter } from "../../domain/entities/search";
import { describeSearchStatus } from "../../domain/services/describe-search-status";
import { useSearch } from "../context/SearchContext";
import styles from "./SearchBar.module.css";

interface SearchBarProps {
  folderName: string;
  onFocusResults: () => void;
  onOpenSelected: () => void;
}

export function SearchBar({ folderName, onFocusResults, onOpenSelected }: SearchBarProps) {
  const text = useSearch((state) => state.text);
  const kindFilter = useSearch((state) => state.kindFilter);
  const includeHidden = useSearch((state) => state.includeHidden);
  const status = useSearch((state) => state.status);
  const matchCount = useSearch((state) => state.matches.length);
  const setText = useSearch((state) => state.setText);
  const setKindFilter = useSearch((state) => state.setKindFilter);
  const toggleIncludeHidden = useSearch((state) => state.toggleIncludeHidden);
  const close = useSearch((state) => state.close);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  function handleKeyDown(event: KeyboardEvent) {
    event.stopPropagation();
    if (event.key === "Escape") close();
    else if (event.key === "ArrowDown") onFocusResults();
    else if (event.key === "Enter") onOpenSelected();
    else return;
    event.preventDefault();
  }

  return (
    <div className={styles.bar} role="search">
      <Icon name="search" className={styles.icon} />
      <input
        ref={inputRef}
        className={styles.input}
        type="search"
        value={text}
        placeholder={`Search in ${folderName}`}
        aria-label="Search"
        spellCheck={false}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <select
        className={styles.select}
        aria-label="Type of item"
        value={kindFilter}
        onChange={(event) => setKindFilter(event.target.value as SearchKindFilter)}
      >
        {SEARCH_KIND_FILTERS.map((filter) => (
          <option key={filter.value} value={filter.value}>
            {filter.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        className={styles.hiddenToggle}
        aria-pressed={includeHidden}
        title="Include hidden files and folders"
        onClick={toggleIncludeHidden}
      >
        Hidden
      </button>
      <span className={styles.status} role="status" aria-live="polite">
        {describeSearchStatus(status, matchCount)}
      </span>
      <button type="button" className="icon-button" aria-label="Close search" title="Close search (Esc)" onClick={close}>
        ×
      </button>
    </div>
  );
}
