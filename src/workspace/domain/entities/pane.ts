import type { Tab } from "./tab";

export interface Pane {
  id: string;
  tabs: Tab[];
  activeTabId: string;
}
