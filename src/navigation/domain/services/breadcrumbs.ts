export interface Breadcrumb {
  label: string;
  path: string;
}

function isWindowsPath(path: string): boolean {
  return /^[A-Za-z]:[\\/]/.test(path) || path.startsWith("\\\\");
}

export function buildBreadcrumbs(path: string): Breadcrumb[] {
  if (isWindowsPath(path)) return buildWindowsBreadcrumbs(path);
  return buildPosixBreadcrumbs(path);
}

function buildPosixBreadcrumbs(path: string): Breadcrumb[] {
  const segments = path.split("/").filter(Boolean);
  const breadcrumbs: Breadcrumb[] = [{ label: "/", path: "/" }];

  segments.forEach((segment, index) => {
    breadcrumbs.push({ label: segment, path: `/${segments.slice(0, index + 1).join("/")}` });
  });
  return breadcrumbs;
}

function buildWindowsBreadcrumbs(path: string): Breadcrumb[] {
  const [root, ...segments] = path.split(/[\\/]/).filter(Boolean);
  const breadcrumbs: Breadcrumb[] = [{ label: root, path: `${root}\\` }];

  segments.forEach((segment, index) => {
    breadcrumbs.push({ label: segment, path: `${root}\\${segments.slice(0, index + 1).join("\\")}` });
  });
  return breadcrumbs;
}
