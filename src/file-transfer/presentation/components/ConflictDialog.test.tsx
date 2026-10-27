import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createFileTransferStore } from "../../application/stores/file-transfer-store";
import type { FileTransferGateway } from "../../application/ports/file-transfer-gateway";
import { FileTransferProvider } from "../context/FileTransferContext";
import { ConflictDialog } from "./ConflictDialog";

async function renderWithConflict() {
  const gateway: FileTransferGateway = {
    startTransfer: vi.fn().mockResolvedValue("t1"),
    cancelTransfer: vi.fn().mockResolvedValue(undefined),
    resolveConflict: vi.fn().mockResolvedValue(undefined),
    subscribeToTransfers: vi.fn(),
    subscribeToExternalDrags: vi.fn(),
  };
  const store = createFileTransferStore({ gateway, refreshDirectory: vi.fn(), notify: vi.fn() });
  await store.getState().startTransfer({ sources: ["/src/a.txt"], destinationDirectory: "/dest", mode: "copy" });
  store.getState().handleEvent({
    type: "conflict",
    conflict: {
      transferId: "t1",
      source: "/src/a.txt",
      target: "/dest/a.txt",
      sourceInfo: { kind: "file", sizeInBytes: 2048, modifiedAtMillis: null },
      targetInfo: { kind: "file", sizeInBytes: 1024, modifiedAtMillis: null },
    },
  });
  render(
    <FileTransferProvider store={store}>
      <ConflictDialog />
    </FileTransferProvider>,
  );
  return gateway;
}

describe("ConflictDialog", () => {
  it("names the conflicting entry and compares both versions", async () => {
    await renderWithConflict();

    expect(screen.getByText('"a.txt" already exists')).toBeTruthy();
    expect(screen.getByText(/2 KB/)).toBeTruthy();
    expect(screen.getByText(/1 KB/)).toBeTruthy();
  });

  it("sends the chosen resolution together with apply to all", async () => {
    const gateway = await renderWithConflict();

    fireEvent.click(screen.getByLabelText("Apply to all conflicts in this transfer"));
    fireEvent.click(screen.getByRole("button", { name: "Replace" }));

    expect(gateway.resolveConflict).toHaveBeenCalledWith("t1", { resolution: "replace", applyToAll: true });
  });

  it("cancels the transfer with Escape and never applies it to all", async () => {
    const gateway = await renderWithConflict();

    fireEvent.click(screen.getByLabelText("Apply to all conflicts in this transfer"));
    fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape" });

    expect(gateway.resolveConflict).toHaveBeenCalledWith("t1", { resolution: "cancel", applyToAll: false });
  });
});
