import { describe, expect, it, vi } from "vitest";
import { createDirectoryBrowsingStore } from "../directory-browsing";
import { createSettingsStore } from "../settings";
import { bindSettings } from "./bind-settings";

function setup() {
  const gateway = {
    loadSettings: vi.fn().mockResolvedValue({
      appearance: { theme: "system" },
      browsing: { showHiddenFiles: true, confirmBeforeTrash: false },
    }),
    saveSettings: vi.fn().mockImplementation(async (settings) => settings),
  };
  const settingsStore = createSettingsStore({ gateway, notifyError: vi.fn() });
  const directoryBrowsingStore = createDirectoryBrowsingStore({ listDirectory: vi.fn() });
  bindSettings({ settingsStore, directoryBrowsingStore });
  return { gateway, settingsStore, directoryBrowsingStore };
}

describe("bindSettings", () => {
  it("shows hidden files when the loaded settings ask for it", async () => {
    const { settingsStore, directoryBrowsingStore } = setup();

    await settingsStore.getState().load();

    expect(directoryBrowsingStore.getState().showHidden).toBe(true);
  });

  it("follows later changes made in the settings screen", async () => {
    const { settingsStore, directoryBrowsingStore } = setup();

    await settingsStore.getState().update({ browsing: { showHiddenFiles: true } });
    expect(directoryBrowsingStore.getState().showHidden).toBe(true);

    await settingsStore.getState().update({ browsing: { showHiddenFiles: false } });
    expect(directoryBrowsingStore.getState().showHidden).toBe(false);
  });

  it("persists the toolbar toggle as the setting without looping", async () => {
    const { gateway, settingsStore, directoryBrowsingStore } = setup();

    directoryBrowsingStore.getState().toggleShowHidden();
    await vi.waitFor(() => expect(gateway.saveSettings).toHaveBeenCalledTimes(1));

    expect(settingsStore.getState().settings.browsing.showHiddenFiles).toBe(true);
    expect(directoryBrowsingStore.getState().showHidden).toBe(true);
  });
});
