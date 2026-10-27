import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { FolderWatchGateway } from "../../../application/ports/folder-watch-gateway";

export const tauriFolderWatchGateway: FolderWatchGateway = {
  watch: (paths) => invoke<void>("watch_folders", { paths }),

  subscribe: (listener) =>
    listen<{ path: string }>("folder-changed", ({ payload }) => listener(payload.path)),
};
