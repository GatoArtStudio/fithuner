import { Fragment, type CSSProperties } from "react";
import { SplitDivider, useWorkspace } from "../workspace";
import { PaneView } from "./PaneView";
import styles from "./WorkspaceView.module.css";

export function WorkspaceView() {
  const panes = useWorkspace((state) => state.workspace.panes);
  const splitRatio = useWorkspace((state) => state.workspace.splitRatio);

  return (
    <div
      className={styles.workspace}
      data-split={panes.length > 1}
      style={{ "--split-ratio": splitRatio } as CSSProperties}
    >
      {panes.map((pane, index) => (
        <Fragment key={pane.id}>
          {index > 0 && <SplitDivider />}
          <PaneView paneId={pane.id} />
        </Fragment>
      ))}
    </div>
  );
}
