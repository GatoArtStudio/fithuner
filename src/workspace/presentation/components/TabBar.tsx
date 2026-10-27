import type { MouseEvent, ReactNode } from "react";
import { Icon } from "../../../shared/icons/Icon";
import type { Tab } from "../../domain/entities/tab";
import { findPane } from "../../domain/services/workspace-queries";
import { useWorkspace } from "../context/WorkspaceContext";
import styles from "./TabBar.module.css";

interface TabBarProps {
  paneId: string;
  renderTitle: (tab: Tab) => ReactNode;
  isActivePane?: boolean;
  trailing?: ReactNode;
}

export function TabBar({ paneId, renderTitle, isActivePane = true, trailing }: TabBarProps) {
  const pane = useWorkspace((state) => findPane(state.workspace, paneId));
  const isSplit = useWorkspace((state) => state.workspace.panes.length > 1);
  const activateTab = useWorkspace((state) => state.activateTab);
  const closeTab = useWorkspace((state) => state.closeTab);
  const newTab = useWorkspace((state) => state.newTab);

  if (!pane) return null;
  const canClose = pane.tabs.length > 1 || isSplit;

  function handleMiddleClick(event: MouseEvent, tabId: string) {
    if (event.button !== 1) return;
    event.preventDefault();
    if (canClose) closeTab(tabId);
  }

  return (
    <div className={styles.bar} data-pane-active={isActivePane}>
      <div className={styles.tabs} role="tablist" aria-label="Tabs">
        {pane.tabs.map((tab) => (
          <div
            key={tab.id}
            role="tab"
            tabIndex={0}
            className={styles.tab}
            aria-selected={tab.id === pane.activeTabId}
            onClick={() => activateTab(tab.id)}
            onMouseDown={(event) => event.button === 1 && event.preventDefault()}
            onAuxClick={(event) => handleMiddleClick(event, tab.id)}
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
    </div>
  );
}
