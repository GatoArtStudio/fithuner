import type { WorkspaceLayoutGateway } from "../../../application/ports/workspace-layout-gateway";
import type { WorkspaceLayout } from "../../../domain/entities/workspace-layout";

export function createMemoryWorkspaceLayoutGateway(initial: WorkspaceLayout | null = null): WorkspaceLayoutGateway {
  let stored = initial;

  return {
    load: () => stored,
    save: (layout) => {
      stored = layout;
    },
    clear: () => {
      stored = null;
    },
  };
}
