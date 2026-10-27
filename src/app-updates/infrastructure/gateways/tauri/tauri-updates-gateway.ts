import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { UpdatesGateway } from "../../../application/ports/updates-gateway";
import type { DownloadProgress, UpdateCheckResult, UpdateError } from "../../../domain/entities/update";

export const tauriUpdatesGateway: UpdatesGateway = {
  checkForUpdate: () => invoke<UpdateCheckResult>("check_for_update"),
  startDownload: () => invoke<void>("download_update"),
  installAndRestart: () => invoke<void>("install_update_and_restart"),
  openReleasePage: () => invoke<void>("open_release_page"),

  subscribeToDownload: async (listener) => {
    const unsubscribes = await Promise.all([
      listen<DownloadProgress>("update-download-progress", ({ payload }) =>
        listener({ type: "progress", progress: payload }),
      ),
      listen<{ error: UpdateError | null }>("update-download-finished", ({ payload }) =>
        listener({ type: "finished", error: payload.error }),
      ),
    ]);
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  },
};
