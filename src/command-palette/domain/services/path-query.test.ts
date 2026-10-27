import { describe, expect, it } from "vitest";
import { expandHome, isPathLike } from "./path-query";

describe("isPathLike", () => {
  it.each(["/etc", "~", "~/Pictures", "C:\\Users", "c:/tmp", "\\\\server\\share", "  /usr  "])("recognizes %j", (text) => {
    expect(isPathLike(text)).toBe(true);
  });

  it.each(["", "new folder", "report 2024", "a/b", "C:"])("does not treat %j as a path", (text) => {
    expect(isPathLike(text)).toBe(false);
  });
});

describe("expandHome", () => {
  it("expands the tilde with the home folder", () => {
    expect(expandHome("~", "/home/ana")).toBe("/home/ana");
    expect(expandHome("~/Pictures", "/home/ana")).toBe("/home/ana/Pictures");
    expect(expandHome("~/", "/home/ana/")).toBe("/home/ana");
  });

  it("uses the separator of the home folder on Windows", () => {
    expect(expandHome("~/Pictures", "C:\\Users\\ana")).toBe("C:\\Users\\ana\\Pictures");
  });

  it("leaves other paths alone and trims them", () => {
    expect(expandHome("  /etc  ", "/home/ana")).toBe("/etc");
    expect(expandHome("~/x", null)).toBe("~/x");
    expect(expandHome("~other", "/home/ana")).toBe("~other");
  });
});
