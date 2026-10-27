import { createContext, useContext, type ReactNode } from "react";
import { useStore } from "zustand";
import type {
  FileOperationsState,
  FileOperationsStore,
} from "../../application/stores/file-operations-store";

const FileOperationsContext = createContext<FileOperationsStore | null>(null);

interface FileOperationsProviderProps {
  store: FileOperationsStore;
  children: ReactNode;
}

export function FileOperationsProvider({ store, children }: FileOperationsProviderProps) {
  return <FileOperationsContext.Provider value={store}>{children}</FileOperationsContext.Provider>;
}

export function useFileOperations<Selected>(
  selector: (state: FileOperationsState) => Selected,
): Selected {
  const store = useContext(FileOperationsContext);
  if (!store) throw new Error("useFileOperations must be used inside FileOperationsProvider");
  return useStore(store, selector);
}
