import { createStore, type StoreApi } from "zustand/vanilla";
import type {
  ConflictDecision,
  ExternalDragEvent,
  TransferConflict,
  TransferEvent,
  TransferFinished,
  TransferMode,
  TransferProgress,
  TransferRequest,
} from "../../domain/entities/transfer";
import type { FileTransferGateway } from "../ports/file-transfer-gateway";

export interface ActiveTransfer {
  id: string;
  mode: TransferMode;
  itemCount: number;
  destinationDirectory: string;
  startedAtMillis: number;
  progress: TransferProgress | null;
  pendingConflict: TransferConflict | null;
}

export interface FileTransferState {
  transfers: ActiveTransfer[];
  externalDropTarget: string | null;
  startTransfer: (request: TransferRequest) => Promise<void>;
  cancelTransfer: (transferId: string) => Promise<void>;
  resolveConflict: (transferId: string, decision: ConflictDecision) => Promise<void>;
  handleEvent: (event: TransferEvent) => void;
  handleExternalDrag: (event: ExternalDragEvent) => void;
}

export type FileTransferStore = StoreApi<FileTransferState>;

export interface FinishedTransfer {
  request: TransferRequest;
  result: TransferFinished;
}

export interface FileTransferDependencies {
  gateway: FileTransferGateway;
  refreshDirectory: () => Promise<void>;
  resolveDropTargetAt: (x: number, y: number) => string | null;
  currentDirectoryPath: () => string | null;
  notify: (message: string, tone: "info" | "error") => void;
  onTransferFinished?: (finished: FinishedTransfer) => void;
  now?: () => number;
}

function eventTransferId(event: TransferEvent): string {
  switch (event.type) {
    case "progress":
      return event.progress.transferId;
    case "conflict":
      return event.conflict.transferId;
    case "finished":
      return event.finished.transferId;
  }
}

export function createFileTransferStore({
  gateway,
  refreshDirectory,
  resolveDropTargetAt,
  currentDirectoryPath,
  notify,
  onTransferFinished,
  now = Date.now,
}: FileTransferDependencies): FileTransferStore {
  const requests = new Map<string, TransferRequest>();
  const eventsBeforeRegistration = new Map<string, TransferEvent[]>();

  function describeOutcome(request: TransferRequest, result: TransferFinished) {
    if (result.error) {
      notify(result.error, "error");
      return;
    }
    const [firstFailure] = result.failed;
    if (firstFailure) {
      notify(
        `${result.failed.length} item(s) could not be ${request.mode === "copy" ? "copied" : "moved"}: ${firstFailure.message}`,
        "error",
      );
    } else if (result.cancelled) {
      notify("Transfer cancelled", "info");
    } else if (result.transferredFiles > 0) {
      const verb = request.mode === "copy" ? "Copied" : "Moved";
      notify(`${verb} ${result.transferredFiles} file(s)`, "info");
    }
  }

  return createStore<FileTransferState>((set, get) => {
    function updateTransfer(transferId: string, update: (transfer: ActiveTransfer) => ActiveTransfer) {
      set(({ transfers }) => ({
        transfers: transfers.map((transfer) => (transfer.id === transferId ? update(transfer) : transfer)),
      }));
    }

    function finish(result: TransferFinished) {
      const request = requests.get(result.transferId);
      requests.delete(result.transferId);
      set(({ transfers }) => ({
        transfers: transfers.filter((transfer) => transfer.id !== result.transferId),
      }));
      void refreshDirectory();
      if (request) {
        describeOutcome(request, result);
        onTransferFinished?.({ request, result });
      }
    }

    return {
      transfers: [],
      externalDropTarget: null,

      startTransfer: async (request) => {
        let transferId: string;
        try {
          transferId = await gateway.startTransfer(request);
        } catch {
          notify("Could not start the transfer", "error");
          return;
        }
        requests.set(transferId, request);
        set(({ transfers }) => ({
          transfers: [
            ...transfers,
            {
              id: transferId,
              mode: request.mode,
              itemCount: request.sources.length,
              destinationDirectory: request.destinationDirectory,
              startedAtMillis: now(),
              progress: null,
              pendingConflict: null,
            },
          ],
        }));
        for (const event of eventsBeforeRegistration.get(transferId) ?? []) get().handleEvent(event);
        eventsBeforeRegistration.delete(transferId);
      },

      cancelTransfer: (transferId) => gateway.cancelTransfer(transferId),

      resolveConflict: async (transferId, decision) => {
        updateTransfer(transferId, (transfer) => ({ ...transfer, pendingConflict: null }));
        await gateway.resolveConflict(transferId, decision);
      },

      handleEvent: (event) => {
        const transferId = eventTransferId(event);
        if (!requests.has(transferId)) {
          eventsBeforeRegistration.set(transferId, [
            ...(eventsBeforeRegistration.get(transferId) ?? []),
            event,
          ]);
          return;
        }
        if (event.type === "progress") {
          updateTransfer(transferId, (transfer) => ({ ...transfer, progress: event.progress }));
        } else if (event.type === "conflict") {
          updateTransfer(transferId, (transfer) => ({ ...transfer, pendingConflict: event.conflict }));
        } else {
          finish(event.finished);
        }
      },

      handleExternalDrag: (event) => {
        if (event.type === "leave") {
          set({ externalDropTarget: null });
          return;
        }
        const target =
          resolveDropTargetAt(event.position.x, event.position.y) ?? currentDirectoryPath();
        if (event.type !== "drop") {
          set({ externalDropTarget: target });
          return;
        }
        set({ externalDropTarget: null });
        if (target !== null && event.paths.length > 0) {
          void get().startTransfer({ sources: event.paths, destinationDirectory: target, mode: "copy" });
        }
      },
    };
  });
}
