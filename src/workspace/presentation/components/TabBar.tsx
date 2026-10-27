import { useRef, useState, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { ContextMenu, type ContextMenuItem } from "../../../shared/components/ContextMenu";
import { Icon } from "../../../shared/icons/Icon";
import type { Tab } from "../../domain/entities/tab";
import { findPane } from "../../domain/services/workspace-queries";
import { useWorkspace } from "../context/WorkspaceContext";
import styles from "./TabBar.module.css";

const DRAG_THRESHOLD_PX = 5;
const PANE_ATTRIBUTE = "data-tab-bar-pane";

interface TabBarProps {
  paneId: string;
  renderTitle: (tab: Tab) => ReactNode;
  isActivePane?: boolean;
  trailing?: ReactNode;
}

interface TabDrag {
  tabId: string;
  startX: number;
  isDragging: boolean;
}

interface TabMenu {
  tabId: string;
  x: number;
  y: number;
}

function paneUnderPointer(x: number, y: number): string | null {
  const element = document.elementFromPoint?.(x, y);
  return element?.closest(`[${PANE_ATTRIBUTE}]`)?.getAttribute(PANE_ATTRIBUTE) ?? null;
}

export function TabBar({ paneId, renderTitle, isActivePane = true, trailing }: TabBarProps) {
  const pane = useWorkspace((state) => findPane(state.workspace, paneId));
  const isSplit = useWorkspace((state) => state.workspace.panes.length > 1);
  const activateTab = useWorkspace((state) => state.activateTab);
  const closeTab = useWorkspace((state) => state.closeTab);
  const closeOtherTabs = useWorkspace((state) => state.closeOtherTabs);
  const duplicateTab = useWorkspace((state) => state.duplicateTab);
  const newTab = useWorkspace((state) => state.newTab);
  const reorderTab = useWorkspace((state) => state.reorderTab);
  const moveTabToPane = useWorkspace((state) => state.moveTabToPane);
  const moveTabToOtherPane = useWorkspace((state) => state.moveTabToOtherPane);
  const tabListRef = useRef<HTMLDivElement>(null);
  const drag = useRef<TabDrag | null>(null);
  const [draggingTabId, setDraggingTabId] = useState<string | null>(null);
  const [menu, setMenu] = useState<TabMenu | null>(null);

  if (!pane) return null;
  const canClose = pane.tabs.length > 1 || isSplit;

  function handleMiddleClick(event: MouseEvent, tabId: string) {
    if (event.button !== 1) return;
    event.preventDefault();
    if (canClose) closeTab(tabId);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>, tabId: string) {
    if (event.button !== 0) return;
    drag.current = { tabId, startX: event.clientX, isDragging: false };
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current || !pane) return;
    if (!current.isDragging) {
      if (Math.abs(event.clientX - current.startX) < DRAG_THRESHOLD_PX) return;
      current.isDragging = true;
      setDraggingTabId(current.tabId);
      event.currentTarget.setPointerCapture?.(event.pointerId);
    }

    const otherTabs = Array.from(tabListRef.current?.querySelectorAll<HTMLElement>('[role="tab"]') ?? []).filter(
      (element) => element.dataset.tabId !== current.tabId,
    );
    const targetIndex = otherTabs.filter((element) => {
      const bounds = element.getBoundingClientRect();
      return event.clientX > bounds.left + bounds.width / 2;
    }).length;
    if (targetIndex !== pane.tabs.findIndex((tab) => tab.id === current.tabId)) {
      reorderTab(current.tabId, targetIndex);
    }
  }

  function finishDrag(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    drag.current = null;
    setDraggingTabId(null);
    if (!current?.isDragging) return;
    const targetPaneId = paneUnderPointer(event.clientX, event.clientY);
    if (targetPaneId !== null && targetPaneId !== paneId) moveTabToPane(current.tabId, targetPaneId);
  }

  function menuItemsFor(tabId: string): ContextMenuItem[] {
    const items: ContextMenuItem[] = [{ label: "Duplicate tab", onSelect: () => duplicateTab(tabId) }];
    if (isSplit) items.push({ label: "Move to other pane", onSelect: () => moveTabToOtherPane(tabId) });
    const closing: ContextMenuItem[] = [];
    if (canClose) closing.push({ label: "Close tab", shortcut: "Ctrl+W", onSelect: () => closeTab(tabId) });
    if (pane && pane.tabs.length > 1) {
      closing.push({ label: "Close other tabs", onSelect: () => closeOtherTabs(tabId) });
    }
    return closing.length > 0 ? [...items, "separator", ...closing] : items;
  }

  return (
    <div className={styles.bar} data-pane-active={isActivePane} {...{ [PANE_ATTRIBUTE]: paneId }}>
      <div ref={tabListRef} className={styles.tabs} role="tablist" aria-label="Tabs">
        {pane.tabs.map((tab) => (
          <div
            key={tab.id}
            role="tab"
            tabIndex={0}
            className={styles.tab}
            data-tab-id={tab.id}
            data-dragging={tab.id === draggingTabId}
            aria-selected={tab.id === pane.activeTabId}
            onClick={() => activateTab(tab.id)}
            onMouseDown={(event) => event.button === 1 && event.preventDefault()}
            onAuxClick={(event) => handleMiddleClick(event, tab.id)}
            onContextMenu={(event) => {
              event.preventDefault();
              activateTab(tab.id);
              setMenu({ tabId: tab.id, x: event.clientX, y: event.clientY });
            }}
            onPointerDown={(event) => handlePointerDown(event, tab.id)}
            onPointerMove={handlePointerMove}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                activateTab(tab.id);
              }
            }}
          >
            <span className={styles.title}>{renderTitle(tab)}</span>
            {canClose && (
              <button
                type="button"
                className={styles.close}
                aria-label="Close tab"
                tabIndex={-1}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  closeTab(tab.id);
                }}
              >
                <Icon name="close" size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
      <button type="button" className={styles.newTab} aria-label="New tab" onClick={() => newTab(paneId)}>
        <Icon name="plus" size={16} />
      </button>
      {trailing}
      {menu && <ContextMenu x={menu.x} y={menu.y} items={menuItemsFor(menu.tabId)} onClose={() => setMenu(null)} />}
    </div>
  );
}
