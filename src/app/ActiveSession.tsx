import type { ReactNode } from "react";
import { useStore } from "zustand";
import { selectActiveSession, type WorkspaceStore } from "../workspace";
import type { BrowsingSession } from "./browsing-session";
import { SessionProviders } from "./SessionProviders";

interface ActiveSessionProps {
  workspaceStore: WorkspaceStore<BrowsingSession>;
  children: ReactNode;
}

export function ActiveSession({ workspaceStore, children }: ActiveSessionProps) {
  const session = useStore(workspaceStore, selectActiveSession);

  return <SessionProviders session={session}>{children}</SessionProviders>;
}
