import type { WorkspaceLayout } from "../../domain/entities/workspace-layout";

export interface WorkspaceLayoutGateway {
  load(): WorkspaceLayout | null;
  save(layout: WorkspaceLayout): void;
  clear(): void;
}
