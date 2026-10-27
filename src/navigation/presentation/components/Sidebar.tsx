import type { ReactNode } from "react";
import { useDirectoryBrowsing } from "../../../directory-browsing";
import { Icon } from "../../../shared/icons/Icon";
import { useNavigation } from "../context/NavigationContext";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  footer?: ReactNode;
}

export function Sidebar({ footer }: SidebarProps) {
  const places = useNavigation((state) => state.places);
  const navigateTo = useNavigation((state) => state.navigateTo);
  const currentPath = useDirectoryBrowsing((state) => state.listing?.path ?? null);

  return (
    <nav className={styles.sidebar} aria-label="Places">
      {places.map((place) => (
        <button
          key={`${place.kind}:${place.path}`}
          type="button"
          className={styles.place}
          data-drop-path={place.path}
          aria-current={place.path === currentPath ? "page" : undefined}
          onClick={() => navigateTo(place.path)}
        >
          <Icon name={place.kind} />
          <span>{place.label}</span>
        </button>
      ))}
      {footer && <div className={styles.footer}>{footer}</div>}
    </nav>
  );
}
