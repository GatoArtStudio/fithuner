import type { DirectoryBrowsingStore } from "../directory-browsing";
import type { SearchStore } from "../folder-search";

interface BindSearchStores {
  searchStore: SearchStore;
  directoryBrowsingStore: DirectoryBrowsingStore;
}

/** A search belongs to the folder it started in, so leaving that folder closes it. */
export function bindSearch({ searchStore, directoryBrowsingStore }: BindSearchStores) {
  return directoryBrowsingStore.subscribe((state, previousState) => {
    const hasChangedFolder = state.listing?.path !== previousState.listing?.path;
    if (hasChangedFolder && searchStore.getState().isOpen) searchStore.getState().close();
  });
}
