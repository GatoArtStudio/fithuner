import { describe, expect, it } from "vitest";
import { buildBreadcrumbs } from "./breadcrumbs";

describe("buildBreadcrumbs", () => {
  it("builds cumulative paths for a posix path", () => {
    expect(buildBreadcrumbs("/home/user/docs")).toEqual([
      { label: "/", path: "/" },
      { label: "home", path: "/home" },
      { label: "user", path: "/home/user" },
      { label: "docs", path: "/home/user/docs" },
    ]);
  });

  it("returns only the root for the posix root", () => {
    expect(buildBreadcrumbs("/")).toEqual([{ label: "/", path: "/" }]);
  });

  it("builds cumulative paths for a windows path", () => {
    expect(buildBreadcrumbs("C:\\Users\\me")).toEqual([
      { label: "C:", path: "C:\\" },
      { label: "Users", path: "C:\\Users" },
      { label: "me", path: "C:\\Users\\me" },
    ]);
  });

  it("returns only the drive for a windows drive root", () => {
    expect(buildBreadcrumbs("D:\\")).toEqual([{ label: "D:", path: "D:\\" }]);
  });
});
