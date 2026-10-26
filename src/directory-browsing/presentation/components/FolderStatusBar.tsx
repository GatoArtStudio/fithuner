import { filterVisibleEntries } from "../../domain/services/sort-entries";
import { useDirectoryBrowsing } from "../context/DirectoryBrowsingContext";
import styles from "./FolderStatusBar.module.css";

export function FolderStatusBar() {
  const listing = useDirectoryBrowsing((state) => state.listing);
  const showHidden = useDirectoryBrowsing((state) => state.showHidden);
  const selectedCount = useDirectoryBrowsing((state) => state.selectedPaths.length);

  const itemCount = filterVisibleEntries(listing?.entries ?? [], showHidden).length;
  const itemLabel = itemCount === 1 ? "1 item" : `${itemCount} items`;

  return (
    <footer className={styles.statusBar}>
      <span>{itemLabel}</span>
      {selectedCount > 0 && <span>{selectedCount} selected</span>}
    </footer>
  );
}
