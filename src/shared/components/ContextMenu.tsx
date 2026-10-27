import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import styles from "./ContextMenu.module.css";

export interface ContextMenuAction {
  label: string;
  shortcut?: string;
  isDanger?: boolean;
  onSelect: () => void;
}

export type ContextMenuItem = ContextMenuAction | "separator";

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y });
  const [activeIndex, setActiveIndex] = useState(0);

  const actionIndexes = items.flatMap((item, index) => (item === "separator" ? [] : [index]));

  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const { width, height } = menu.getBoundingClientRect();
    setPosition({
      x: Math.max(0, Math.min(x, window.innerWidth - width - 8)),
      y: Math.max(0, Math.min(y, window.innerHeight - height - 8)),
    });
    menu.focus();
  }, [x, y]);

  useEffect(() => {
    function closeOnOutsidePointer(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) onClose();
    }
    window.addEventListener("pointerdown", closeOnOutsidePointer);
    window.addEventListener("blur", onClose);
    return () => {
      window.removeEventListener("pointerdown", closeOnOutsidePointer);
      window.removeEventListener("blur", onClose);
    };
  }, [onClose]);

  function moveActive(step: number) {
    const current = actionIndexes.indexOf(activeIndex);
    const next = (current + step + actionIndexes.length) % actionIndexes.length;
    setActiveIndex(actionIndexes[next]);
  }

  function selectAction(item: ContextMenuAction) {
    onClose();
    item.onSelect();
  }

  function handleKeyDown(event: KeyboardEvent) {
    event.stopPropagation();
    if (event.key === "ArrowDown") moveActive(1);
    else if (event.key === "ArrowUp") moveActive(-1);
    else if (event.key === "Escape") onClose();
    else if (event.key === "Enter") {
      const item = items[activeIndex];
      if (item && item !== "separator") selectAction(item);
    } else return;
    event.preventDefault();
  }

  return (
    <div
      ref={menuRef}
      className={styles.menu}
      role="menu"
      tabIndex={-1}
      style={{ left: position.x, top: position.y }}
      onKeyDown={handleKeyDown}
      onContextMenu={(event) => event.preventDefault()}
    >
      {items.map((item, index) =>
        item === "separator" ? (
          <div key={`separator-${index}`} className={styles.separator} role="separator" />
        ) : (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            className={`${styles.item} ${index === activeIndex ? styles.active : ""} ${
              item.isDanger ? styles.danger : ""
            }`}
            onMouseEnter={() => setActiveIndex(index)}
            onClick={() => selectAction(item)}
          >
            <span>{item.label}</span>
            {item.shortcut && <span className={styles.shortcut}>{item.shortcut}</span>}
          </button>
        ),
      )}
    </div>
  );
}
