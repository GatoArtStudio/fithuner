import {
  createDirectoryBrowsingStore,
  tauriDirectoryGateway,
} from "../directory-browsing";
import { createNavigationStore, tauriPlacesGateway } from "../navigation";

export function composeApplication() {
  const directoryBrowsingStore = createDirectoryBrowsingStore(tauriDirectoryGateway);
  const navigationStore = createNavigationStore({
    placesGateway: tauriPlacesGateway,
    openDirectory: directoryBrowsingStore.getState().openDirectory,
  });

  return { directoryBrowsingStore, navigationStore };
}
