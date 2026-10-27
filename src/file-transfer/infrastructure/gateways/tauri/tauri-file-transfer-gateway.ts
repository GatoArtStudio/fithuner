import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import type { FileTransferGateway, Unsubscribe } from "../../../application/ports/file-transfer-gateway";
import type {
  TransferConflict,
  TransferFinished,
  TransferProgress,
} from "../../../domain/entities/transfer";

function combine(unsubscribes: Unsubscribe[]): Unsubscribe {
  return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
}

export const tauriFileTransferGateway: FileTransferGateway = {
  startTransfer: (request) => invoke<string>("start_transfer", { request }),
  cancelTransfer: (transferId) => invoke<void>("cancel_transfer", { transferId }),
  resolveConflict: (transferId, decision) => invoke<void>("resolve_conflict", { transferId, decision }),

  subscribeToTransfers: async (listener) =>
    combine(
      await Promise.all([
        listen<TransferProgress>("transfer-progress", ({ payload }) =>
          listener({ type: "progress", progress: payload }),
        ),
        listen<TransferConflict>("transfer-conflict", ({ payload }) =>
          listener({ type: "conflict", conflict: payload }),
        ),
        listen<TransferFinished>("transfer-finished", ({ payload }) =>
          listener({ type: "finished", finished: payload }),
        ),
      ]),
    ),

  subscribeToExternalDrags: (listener) =>
    getCurrentWebview().onDragDropEvent(({ payload }) => {
      const scale = window.devicePixelRatio || 1;
      if (payload.type === "leave") {
        listener({ type: "leave" });
        return;
      }
      const position = { x: payload.position.x / scale, y: payload.position.y / scale };
      if (payload.type === "drop") listener({ type: "drop", paths: payload.paths, position });
      else listener({ type: payload.type, position });
    }),
};
