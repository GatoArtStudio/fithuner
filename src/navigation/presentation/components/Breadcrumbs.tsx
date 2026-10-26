import { Fragment } from "react";
import { useDirectoryBrowsing } from "../../../directory-browsing";
import { Icon } from "../../../shared/icons/Icon";
import { buildBreadcrumbs } from "../../domain/services/breadcrumbs";
import { useNavigation } from "../context/NavigationContext";
import styles from "./Breadcrumbs.module.css";

export function Breadcrumbs() {
  const currentPath = useDirectoryBrowsing((state) => state.listing?.path ?? null);
  const navigateTo = useNavigation((state) => state.navigateTo);

  if (currentPath === null) return <nav className={styles.breadcrumbs} aria-label="Path" />;

  const breadcrumbs = buildBreadcrumbs(currentPath);

  return (
    <nav className={styles.breadcrumbs} aria-label="Path">
      {breadcrumbs.map((breadcrumb, index) => (
        <Fragment key={breadcrumb.path}>
          {index > 0 && <Icon name="chevron" size={14} className={styles.separator} />}
          <button
            type="button"
            className={styles.segment}
            aria-current={index === breadcrumbs.length - 1 ? "page" : undefined}
            onClick={() => navigateTo(breadcrumb.path)}
          >
            {breadcrumb.label}
          </button>
        </Fragment>
      ))}
    </nav>
  );
}
