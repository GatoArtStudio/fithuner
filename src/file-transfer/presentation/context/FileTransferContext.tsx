import { createContext, useContext, type ReactNode } from "react";
import { useStore } from "zustand";
import type { FileTransferState, FileTransferStore } from "../../application/stores/file-transfer-store";

const FileTransferContext = createContext<FileTransferStore | null>(null);

interface FileTransferProviderProps {
  store: FileTransferStore;
  children: ReactNode;
}

export function FileTransferProvider({ store, children }: FileTransferProviderProps) {
  return <FileTransferContext.Provider value={store}>{children}</FileTransferContext.Provider>;
}

export function useFileTransfer<Selected>(selector: (state: FileTransferState) => Selected): Selected {
  const store = useContext(FileTransferContext);
  if (!store) throw new Error("useFileTransfer must be used inside FileTransferProvider");
  return useStore(store, selector);
}
