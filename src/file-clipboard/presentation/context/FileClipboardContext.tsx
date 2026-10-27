import { createContext, useContext, type ReactNode } from "react";
import { useStore } from "zustand";
import type { FileClipboardState, FileClipboardStore } from "../../application/stores/file-clipboard-store";

const FileClipboardContext = createContext<FileClipboardStore | null>(null);

interface FileClipboardProviderProps {
  store: FileClipboardStore;
  children: ReactNode;
}

export function FileClipboardProvider({ store, children }: FileClipboardProviderProps) {
  return <FileClipboardContext.Provider value={store}>{children}</FileClipboardContext.Provider>;
}

export function useFileClipboard<Selected>(selector: (state: FileClipboardState) => Selected): Selected {
  const store = useContext(FileClipboardContext);
  if (!store) throw new Error("useFileClipboard must be used inside FileClipboardProvider");
  return useStore(store, selector);
}
