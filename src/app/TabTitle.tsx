import { useStore } from "zustand";
import { fileNameOf } from "../file-operations";
import { useWorkspace } from "../workspace";
import type { BrowsingSession } from "./browsing-session";

interface TabTitleProps {
  sessionId: string;
}

export function TabTitle({ sessionId }: TabTitleProps) {
  const session = useWorkspace<BrowsingSession, BrowsingSession | undefined>((state) => state.sessions[sessionId]);
  const path = useStore(session!.directoryBrowsingStore, (state) => state.listing?.path ?? null);

  if (path === null) return "Loading…";
  return fileNameOf(path) || path;
}
