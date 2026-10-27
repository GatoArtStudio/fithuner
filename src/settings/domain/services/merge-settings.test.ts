import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../entities/app-settings";
import { mergeSettings } from "./merge-settings";

describe("mergeSettings", () => {
  it("changes only the patched fields", () => {
    const merged = mergeSettings(DEFAULT_SETTINGS, { browsing: { showHiddenFiles: true } });

    expect(merged.browsing).toEqual({ showHiddenFiles: true, confirmBeforeTrash: false });
    expect(merged.appearance).toEqual(DEFAULT_SETTINGS.appearance);
  });

  it("does not mutate the original settings", () => {
    mergeSettings(DEFAULT_SETTINGS, { appearance: { theme: "dark" } });

    expect(DEFAULT_SETTINGS.appearance.theme).toBe("system");
  });
});
