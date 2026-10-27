import type { DirectoryListing } from "../../domain/entities/file-entry";

export interface DirectoryGateway {
  listDirectory(path?: string): Promise<DirectoryListing>;
}
