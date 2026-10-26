import { invoke } from "@tauri-apps/api/core";
import type { DirectoryGateway } from "../../../application/ports/directory-gateway";
import type { DirectoryListing } from "../../../domain/entities/file-entry";

export const tauriDirectoryGateway: DirectoryGateway = {
  listDirectory: (path) => invoke<DirectoryListing>("list_directory", { path: path ?? null }),
};
