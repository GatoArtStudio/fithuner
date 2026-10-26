import type { DirectoryListing } from "../domain/file-entry";

export interface DirectoryGateway {
  listDirectory(path?: string): Promise<DirectoryListing>;
}
