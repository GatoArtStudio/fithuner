import { createStore, type StoreApi } from "zustand/vanilla";
import type { FileClipboardGateway } from "../ports/file-clipboard-gateway";

export interface FileClipboardState {
  cutPaths: string[];
  copySelected: () => Promise<void>;
  cutSelected: () => Promise<void>;
  paste: (targetDirectory?: string) => Promise<void>;
}

export type FileClipboardStore = StoreApi<FileClipboardState>;

export interface FileClipboardDependencies {
  gateway: FileClipboardGateway;
  directory: {
    selectedPaths: () => string[];
    currentDirectoryPath: () => string | null;
  };
  startTransfer: (request: {
    sources: string[];
    destinationDirectory: string;
    mode: "copy" | "move";
  }) => Promise<void>;
  notifyError: (message: string) => void;
}

export function createFileClipboardStore({
  gateway,
  directory,
  startTransfer,
  notifyError,
}: FileClipboardDependencies): FileClipboardStore {
  return createStore<FileClipboardState>((set) => {
    async function placeSelection(intent: "copy" | "cut") {
      const paths = directory.selectedPaths();
      if (paths.length === 0) return;
      try {
        await gateway.placeFiles(paths, intent);
        set({ cutPaths: intent === "cut" ? paths : [] });
      } catch {
        notifyError("Could not access the clipboard");
      }
    }

    return {
      cutPaths: [],

      copySelected: () => placeSelection("copy"),
      cutSelected: () => placeSelection("cut"),

      paste: async (targetDirectory) => {
        const destinationDirectory = targetDirectory ?? directory.currentDirectoryPath();
        if (destinationDirectory === null) return;

        let clipboardFiles;
        try {
          clipboardFiles = await gateway.readFiles();
        } catch {
          notifyError("Could not read the clipboard");
          return;
        }
        if (clipboardFiles.paths.length === 0) return;

        const isCut = clipboardFiles.intent === "cut";
        await startTransfer({
          sources: clipboardFiles.paths,
          destinationDirectory,
          mode: isCut ? "move" : "copy",
        });
        if (isCut) {
          set({ cutPaths: [] });
          await gateway.clearCutMarker().catch(() => undefined);
        }
      },
    };
  });
}
