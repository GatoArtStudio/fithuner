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

  it("merges a single provider without touching the others", () => {
    const merged = mergeSettings(DEFAULT_SETTINGS, { preview: { providers: { csv: { maxSizeMegabytes: 12 } } } });

    expect(merged.preview.providers.csv).toEqual({ enabled: true, maxSizeMegabytes: 12 });
    expect(merged.preview.providers.pdf).toEqual(DEFAULT_SETTINGS.preview.providers.pdf);
  });

  it("merges panel options while keeping the providers", () => {
    const merged = mergeSettings(DEFAULT_SETTINGS, { preview: { panelPosition: "bottom", showPanel: false } });

    expect(merged.preview).toMatchObject({ panelPosition: "bottom", showPanel: false, panelSizePx: 340 });
    expect(merged.preview.providers).toEqual(DEFAULT_SETTINGS.preview.providers);
  });
});
