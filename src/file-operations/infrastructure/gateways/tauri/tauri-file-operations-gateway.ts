import { invoke } from "@tauri-apps/api/core";
import type { FileOperationsGateway } from "../../../application/ports/file-operations-gateway";
import type { BatchOutcome } from "../../../domain/entities/file-operation";

export const tauriFileOperationsGateway: FileOperationsGateway = {
  openEntry: (path) => invoke<void>("open_entry", { path }),
  createEntry: (parentPath, kind) => invoke<string>("create_entry", { parentPath, kind }),
  renameEntry: (path, newName) => invoke<string>("rename_entry", { path, newName }),
  trashEntries: (paths) => invoke<BatchOutcome>("trash_entries", { paths }),
  deleteEntriesPermanently: (paths) => invoke<BatchOutcome>("delete_entries_permanently", { paths }),
};
