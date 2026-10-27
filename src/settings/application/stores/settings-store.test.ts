import { describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS, type AppSettings } from "../../domain/entities/app-settings";
import type { SettingsGateway } from "../ports/settings-gateway";
import { createSettingsStore } from "./settings-store";

const darkSettings: AppSettings = {
  ...DEFAULT_SETTINGS,
  appearance: { theme: "dark" },
  browsing: { showHiddenFiles: true, confirmBeforeTrash: false },
};

function setup(overrides: Partial<SettingsGateway> = {}) {
  const gateway: SettingsGateway = {
    loadSettings: vi.fn().mockResolvedValue(darkSettings),
    saveSettings: vi.fn().mockImplementation(async (settings: AppSettings) => settings),
    ...overrides,
  };
  const notifyError = vi.fn();
  return { store: createSettingsStore({ gateway, notifyError }), gateway, notifyError };
}

describe("settings store", () => {
  it("loads the persisted settings", async () => {
    const { store } = setup();

    await store.getState().load();

    expect(store.getState().settings).toEqual(darkSettings);
    expect(store.getState().isLoaded).toBe(true);
  });

  it("keeps the defaults when loading fails", async () => {
    const { store } = setup({ loadSettings: vi.fn().mockRejectedValue(new Error("boom")) });

    await store.getState().load();

    expect(store.getState().settings).toEqual(DEFAULT_SETTINGS);
    expect(store.getState().isLoaded).toBe(true);
  });

  it("applies an update immediately and persists it", async () => {
    const { store, gateway } = setup();
    await store.getState().load();

    const saving = store.getState().update({ appearance: { theme: "light" } });
    expect(store.getState().settings.appearance.theme).toBe("light");
    await saving;

    expect(gateway.saveSettings).toHaveBeenCalledWith({
      ...darkSettings,
      appearance: { theme: "light" },
    });
  });

  it("rolls back to the last saved settings and reports when saving fails", async () => {
    const { store, notifyError } = setup({ saveSettings: vi.fn().mockRejectedValue(new Error("disk full")) });
    await store.getState().load();

    await store.getState().update({ appearance: { theme: "light" } });

    expect(store.getState().settings).toEqual(darkSettings);
    expect(notifyError).toHaveBeenCalledWith("Could not save your settings");
  });

  it("saves rapid updates in order without losing any of them", async () => {
    const { store, gateway } = setup();
    await store.getState().load();

    const first = store.getState().update({ browsing: { confirmBeforeTrash: true } });
    const second = store.getState().update({ appearance: { theme: "light" } });
    await Promise.all([first, second]);

    expect(store.getState().settings).toEqual({
      ...darkSettings,
      appearance: { theme: "light" },
      browsing: { showHiddenFiles: true, confirmBeforeTrash: true },
    });
    const saveCalls = vi.mocked(gateway.saveSettings).mock.calls;
    expect(saveCalls[saveCalls.length - 1][0]).toEqual(store.getState().settings);
  });

  it("opens and closes the settings view on a section", () => {
    const { store } = setup();

    store.getState().openSettings("appearance");
    expect(store.getState()).toMatchObject({ isOpen: true, activeSection: "appearance" });

    store.getState().closeSettings();
    expect(store.getState().isOpen).toBe(false);
  });
});
