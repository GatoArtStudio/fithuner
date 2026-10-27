import { describe, expect, it, vi } from "vitest";
import type {
  TransferConflict,
  TransferFinished,
  TransferProgress,
  TransferRequest,
} from "../../domain/entities/transfer";
import type { FileTransferGateway } from "../ports/file-transfer-gateway";
import { createFileTransferStore } from "./file-transfer-store";

const request: TransferRequest = {
  sources: ["/src/a.txt", "/src/b.txt"],
  destinationDirectory: "/dest",
  mode: "copy",
};

const progress: TransferProgress = {
  transferId: "t1",
  bytesDone: 50,
  bytesTotal: 100,
  filesDone: 1,
  filesTotal: 2,
  currentPath: "/src/b.txt",
};

const finished: TransferFinished = {
  transferId: "t1",
  transferredFiles: 2,
  skipped: [],
  failed: [],
  cancelled: false,
  transferred: [],
  error: null,
};

function setup(gatewayOverrides: Partial<FileTransferGateway> = {}) {
  const gateway: FileTransferGateway = {
    startTransfer: vi.fn().mockResolvedValue("t1"),
    cancelTransfer: vi.fn().mockResolvedValue(undefined),
    resolveConflict: vi.fn().mockResolvedValue(undefined),
    subscribeToTransfers: vi.fn(),
    subscribeToExternalDrags: vi.fn(),
    ...gatewayOverrides,
  };
  const refreshDirectory = vi.fn().mockResolvedValue(undefined);
  const notify = vi.fn();
  const onTransferFinished = vi.fn();
  const store = createFileTransferStore({
    gateway,
    refreshDirectory,
    resolveDropTargetAt: (x) => (x < 100 ? "/hovered" : null),
    currentDirectoryPath: () => "/current",
    notify,
    onTransferFinished,
    now: () => 1000,
  });
  return { store, gateway, refreshDirectory, notify, onTransferFinished };
}

describe("file transfer store", () => {
  it("registers a started transfer and tracks its progress", async () => {
    const { store } = setup();

    await store.getState().startTransfer(request);
    store.getState().handleEvent({ type: "progress", progress });

    const [transfer] = store.getState().transfers;
    expect(transfer).toMatchObject({ id: "t1", mode: "copy", itemCount: 2, startedAtMillis: 1000 });
    expect(transfer.progress).toEqual(progress);
  });

  it("replays events that arrive before the start call resolves", async () => {
    const { store } = setup();

    store.getState().handleEvent({ type: "progress", progress });
    expect(store.getState().transfers).toEqual([]);
    await store.getState().startTransfer(request);

    expect(store.getState().transfers[0].progress).toEqual(progress);
  });

  it("keeps the conflict until it is resolved and forwards the decision", async () => {
    const { store, gateway } = setup();
    await store.getState().startTransfer(request);
    const conflict: TransferConflict = {
      transferId: "t1",
      source: "/src/a.txt",
      target: "/dest/a.txt",
      sourceInfo: { kind: "file", sizeInBytes: 1, modifiedAtMillis: null },
      targetInfo: { kind: "file", sizeInBytes: 2, modifiedAtMillis: null },
    };

    store.getState().handleEvent({ type: "conflict", conflict });
    expect(store.getState().transfers[0].pendingConflict).toEqual(conflict);

    await store.getState().resolveConflict("t1", { resolution: "replace", applyToAll: true });
    expect(store.getState().transfers[0].pendingConflict).toBeNull();
    expect(gateway.resolveConflict).toHaveBeenCalledWith("t1", { resolution: "replace", applyToAll: true });
  });

  it("removes the transfer, refreshes the folder and reports success when finished", async () => {
    const { store, refreshDirectory, notify, onTransferFinished } = setup();
    await store.getState().startTransfer(request);

    store.getState().handleEvent({ type: "finished", finished });

    expect(store.getState().transfers).toEqual([]);
    expect(refreshDirectory).toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith("Copied 2 file(s)", "info");
    expect(onTransferFinished).toHaveBeenCalledWith({ request, result: finished });
  });

  it("reports failures as errors", async () => {
    const { store, notify } = setup();
    await store.getState().startTransfer(request);

    store.getState().handleEvent({
      type: "finished",
      finished: { ...finished, failed: [{ path: "/src/a.txt", message: "Permission denied" }] },
    });

    expect(notify).toHaveBeenCalledWith("1 item(s) could not be copied: Permission denied", "error");
  });

  it("reports cancellation", async () => {
    const { store, notify } = setup();
    await store.getState().startTransfer(request);

    store.getState().handleEvent({ type: "finished", finished: { ...finished, cancelled: true } });

    expect(notify).toHaveBeenCalledWith("Transfer cancelled", "info");
  });

  it("notifies when the transfer cannot be started", async () => {
    const { store, notify } = setup({ startTransfer: vi.fn().mockRejectedValue(new Error("boom")) });

    await store.getState().startTransfer(request);

    expect(store.getState().transfers).toEqual([]);
    expect(notify).toHaveBeenCalledWith("Could not start the transfer", "error");
  });

  it("forwards cancellation to the gateway", async () => {
    const { store, gateway } = setup();

    await store.getState().cancelTransfer("t1");

    expect(gateway.cancelTransfer).toHaveBeenCalledWith("t1");
  });

  it("highlights the folder under an external drag and falls back to the current folder", () => {
    const { store } = setup();

    store.getState().handleExternalDrag({ type: "over", position: { x: 10, y: 10 } });
    expect(store.getState().externalDropTarget).toBe("/hovered");

    store.getState().handleExternalDrag({ type: "over", position: { x: 500, y: 10 } });
    expect(store.getState().externalDropTarget).toBe("/current");

    store.getState().handleExternalDrag({ type: "leave" });
    expect(store.getState().externalDropTarget).toBeNull();
  });

  it("copies files dropped from another application into the hovered folder", async () => {
    const { store, gateway } = setup();

    store.getState().handleExternalDrag({ type: "drop", paths: ["/outside/a.txt"], position: { x: 10, y: 10 } });
    await vi.waitFor(() => expect(gateway.startTransfer).toHaveBeenCalled());

    expect(gateway.startTransfer).toHaveBeenCalledWith({
      sources: ["/outside/a.txt"],
      destinationDirectory: "/hovered",
      mode: "copy",
    });
    expect(store.getState().externalDropTarget).toBeNull();
  });
});
