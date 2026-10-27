import { Fragment, useEffect, useId, useRef, type KeyboardEvent } from "react";
import { GROUP_LABELS, type RankedPaletteItem } from "../../domain/entities/palette-item";
import { useCommandPalette } from "../context/CommandPaletteContext";
import styles from "./CommandPalette.module.css";

function HighlightedTitle({ title, indices }: { title: string; indices: number[] }) {
  if (indices.length === 0) return <>{title}</>;
  const matched = new Set(indices);
  const runs: { text: string; isMatch: boolean }[] = [];
  Array.from(title).forEach((character, index) => {
    const isMatch = matched.has(index);
    const last = runs[runs.length - 1];
    if (last && last.isMatch === isMatch) last.text += character;
    else runs.push({ text: character, isMatch });
  });

  return (
    <>
      {runs.map((run, index) =>
        run.isMatch ? (
          <mark key={index} className={styles.match}>
            {run.text}
          </mark>
        ) : (
          <span key={index}>{run.text}</span>
        ),
      )}
    </>
  );
}

function PaletteDialog() {
  const query = useCommandPalette((state) => state.query);
  const results = useCommandPalette((state) => state.results);
  const selectedIndex = useCommandPalette((state) => state.selectedIndex);
  const setQuery = useCommandPalette((state) => state.setQuery);
  const moveSelection = useCommandPalette((state) => state.moveSelection);
  const selectIndex = useCommandPalette((state) => state.selectIndex);
  const runSelected = useCommandPalette((state) => state.runSelected);
  const runItem = useCommandPalette((state) => state.runItem);
  const close = useCommandPalette((state) => state.close);
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    return () => previouslyFocused?.focus();
  }, []);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView?.({ block: "nearest" });
  }, [selectedIndex, results]);

  function handleKeyDown(event: KeyboardEvent) {
    event.stopPropagation();
    if (event.key === "ArrowDown") moveSelection(1);
    else if (event.key === "ArrowUp") moveSelection(-1);
    else if (event.key === "Enter") runSelected();
    else if (event.key === "Escape") close();
    else return;
    event.preventDefault();
  }

  return (
    <div className={styles.backdrop} onClick={close}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <input
          ref={inputRef}
          className={styles.input}
          value={query}
          placeholder="Type a command, a folder or a path"
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={results.length > 0 ? `${listId}-${selectedIndex}` : undefined}
          aria-label="Command"
          spellCheck={false}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div ref={listRef} id={listId} className={styles.list} role="listbox">
          {results.length === 0 && <p className={styles.empty}>No matching commands</p>}
          {results.map((ranked: RankedPaletteItem, index) => {
            const { item } = ranked;
            const showsHeader = index === 0 || results[index - 1].item.group !== item.group;
            return (
              <Fragment key={item.id}>
                {showsHeader && <div className={styles.groupLabel}>{GROUP_LABELS[item.group]}</div>}
                <div
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={index === selectedIndex}
                  aria-label={item.title}
                  className={`${styles.option} ${index === selectedIndex ? styles.selected : ""}`}
                  onMouseMove={() => index !== selectedIndex && selectIndex(index)}
                  onClick={() => runItem(item)}
                >
                  <span className={styles.titleBlock}>
                    <span className={styles.title}>
                      <HighlightedTitle title={item.title} indices={ranked.titleIndices} />
                    </span>
                    {item.subtitle && <span className={styles.subtitle}>{item.subtitle}</span>}
                  </span>
                  {item.shortcut && <kbd className={styles.shortcut}>{item.shortcut}</kbd>}
                </div>
              </Fragment>
            );
          })}
        </div>
        <p className={styles.hint}>↑ ↓ to choose · Enter to run · Esc to close</p>
      </div>
    </div>
  );
}

export function CommandPalette() {
  const isOpen = useCommandPalette((state) => state.isOpen);
  return isOpen ? <PaletteDialog /> : null;
}
