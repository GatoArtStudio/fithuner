import type { WorkspaceLayoutGateway } from "../../../application/ports/workspace-layout-gateway";
import { parseWorkspaceLayout } from "../../../domain/services/workspace-layout";

export const WORKSPACE_LAYOUT_STORAGE_KEY = "fithuner.workspace-layout.v1";

export function createLocalStorageWorkspaceLayoutGateway(
  getStorage: () => Storage = () => window.localStorage,
): WorkspaceLayoutGateway {
  return {
    load: () => {
      try {
        const raw = getStorage().getItem(WORKSPACE_LAYOUT_STORAGE_KEY);
        return raw === null ? null : parseWorkspaceLayout(JSON.parse(raw));
      } catch {
        return null;
      }
    },

    save: (layout) => {
      try {
        getStorage().setItem(WORKSPACE_LAYOUT_STORAGE_KEY, JSON.stringify(layout));
      } catch {
        // The layout is a convenience; losing it must never break the app.
      }
    },

    clear: () => {
      try {
        getStorage().removeItem(WORKSPACE_LAYOUT_STORAGE_KEY);
      } catch {
        // Nothing to clean up when storage is unavailable.
      }
    },
  };
}
