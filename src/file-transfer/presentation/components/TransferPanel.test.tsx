import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createFileTransferStore } from "../../application/stores/file-transfer-store";
import type { FileTransferGateway } from "../../application/ports/file-transfer-gateway";
import { FileTransferProvider } from "../context/FileTransferContext";
import { TransferPanel } from "./TransferPanel";

describe("TransferPanel", () => {
  it("shows nothing when there are no transfers", () => {
    const gateway = { startTransfer: vi.fn() } as unknown as FileTransferGateway;
    const store = createFileTransferStore({ gateway, refreshDirectory: vi.fn(), resolveDropTargetAt: () => null, currentDirectoryPath: () => null, notify: vi.fn() });

    const { container } = render(
      <FileTransferProvider store={store}>
        <TransferPanel />
      </FileTransferProvider>,
    );

    expect(container.firstChild).toBeNull();
  });

  it("shows progress and lets the user cancel", async () => {
    const gateway: FileTransferGateway = {
      startTransfer: vi.fn().mockResolvedValue("t1"),
      cancelTransfer: vi.fn().mockResolvedValue(undefined),
      resolveConflict: vi.fn(),
      subscribeToTransfers: vi.fn(),
      subscribeToExternalDrags: vi.fn(),
    };
    const store = createFileTransferStore({ gateway, refreshDirectory: vi.fn(), resolveDropTargetAt: () => null, currentDirectoryPath: () => null, notify: vi.fn() });
    await store.getState().startTransfer({ sources: ["/a", "/b"], destinationDirectory: "/home/docs", mode: "move" });
    store.getState().handleEvent({
      type: "progress",
      progress: { transferId: "t1", bytesDone: 50, bytesTotal: 100, filesDone: 1, filesTotal: 2, currentPath: "/b/photo.jpg" },
    });

    render(
      <FileTransferProvider store={store}>
        <TransferPanel />
      </FileTransferProvider>,
    );

    expect(screen.getAllByText("Moving 2 items to docs").length).toBeGreaterThan(0);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("50");
    expect(screen.getByText("photo.jpg")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Cancel transfer" }));
    expect(gateway.cancelTransfer).toHaveBeenCalledWith("t1");
  });
});
