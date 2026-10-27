import { describe, expect, it, vi } from "vitest";
import type { ClipboardFiles } from "../../domain/entities/clipboard";
import type { FileClipboardGateway } from "../ports/file-clipboard-gateway";
import { createFileClipboardStore } from "./file-clipboard-store";

function setup(clipboard: ClipboardFiles = { paths: [], intent: "copy" }, selected: string[] = ["/docs/a.txt"]) {
  const gateway: FileClipboardGateway = {
    placeFiles: vi.fn().mockResolvedValue(undefined),
    readFiles: vi.fn().mockResolvedValue(clipboard),
    clearCutMarker: vi.fn().mockResolvedValue(undefined),
  };
  const startTransfer = vi.fn().mockResolvedValue(undefined);
  const notifyError = vi.fn();
  const store = createFileClipboardStore({
    gateway,
    directory: { selectedPaths: () => selected, currentDirectoryPath: () => "/current" },
    startTransfer,
    notifyError,
  });
  return { store, gateway, startTransfer, notifyError };
}

describe("file clipboard store", () => {
  it("copies the selection without marking anything as cut", async () => {
    const { store, gateway } = setup();

    await store.getState().copySelected();

    expect(gateway.placeFiles).toHaveBeenCalledWith(["/docs/a.txt"], "copy");
    expect(store.getState().cutPaths).toEqual([]);
  });

  it("remembers the cut paths so they can be dimmed", async () => {
    const { store, gateway } = setup();

    await store.getState().cutSelected();

    expect(gateway.placeFiles).toHaveBeenCalledWith(["/docs/a.txt"], "cut");
    expect(store.getState().cutPaths).toEqual(["/docs/a.txt"]);
  });

  it("does nothing when the selection is empty", async () => {
    const { store, gateway } = setup(undefined, []);

    await store.getState().copySelected();

    expect(gateway.placeFiles).not.toHaveBeenCalled();
  });

  it("pastes copied files into the current folder as a copy", async () => {
    const { store, startTransfer } = setup({ paths: ["/docs/a.txt"], intent: "copy" });

    await store.getState().paste();

    expect(startTransfer).toHaveBeenCalledWith({
      sources: ["/docs/a.txt"],
      destinationDirectory: "/current",
      mode: "copy",
    });
  });

  it("pastes cut files as a move and clears the cut state", async () => {
    const { store, startTransfer, gateway } = setup({ paths: ["/docs/a.txt"], intent: "cut" });
    await store.getState().cutSelected();

    await store.getState().paste("/target");

    expect(startTransfer).toHaveBeenCalledWith({
      sources: ["/docs/a.txt"],
      destinationDirectory: "/target",
      mode: "move",
    });
    expect(gateway.clearCutMarker).toHaveBeenCalled();
    expect(store.getState().cutPaths).toEqual([]);
  });

  it("ignores an empty clipboard", async () => {
    const { store, startTransfer } = setup({ paths: [], intent: "copy" });

    await store.getState().paste();

    expect(startTransfer).not.toHaveBeenCalled();
  });

  it("reports clipboard failures", async () => {
    const { store, notifyError, gateway } = setup();
    vi.mocked(gateway.readFiles).mockRejectedValue(new Error("no clipboard"));

    await store.getState().paste();

    expect(notifyError).toHaveBeenCalledWith("Could not read the clipboard");
  });
});
