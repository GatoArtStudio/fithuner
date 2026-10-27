import { createStore, type StoreApi } from "zustand/vanilla";
import {
  DEFAULT_SETTINGS,
  type AppSettings,
  type SettingsPatch,
  type SettingsSection,
} from "../../domain/entities/app-settings";
import { mergeSettings } from "../../domain/services/merge-settings";
import type { SettingsGateway } from "../ports/settings-gateway";

export interface SettingsState {
  settings: AppSettings;
  isLoaded: boolean;
  isOpen: boolean;
  activeSection: SettingsSection;
  load: () => Promise<void>;
  update: (patch: SettingsPatch) => Promise<void>;
  openSettings: (section?: SettingsSection) => void;
  closeSettings: () => void;
  selectSection: (section: SettingsSection) => void;
}

export type SettingsStore = StoreApi<SettingsState>;

export interface SettingsDependencies {
  gateway: SettingsGateway;
  notifyError: (message: string) => void;
}

export function createSettingsStore({ gateway, notifyError }: SettingsDependencies): SettingsStore {
  let lastPersisted = DEFAULT_SETTINGS;
  let saveQueue: Promise<void> = Promise.resolve();

  return createStore<SettingsState>((set, get) => {
    function enqueueSave() {
      saveQueue = saveQueue.then(async () => {
        const desired = get().settings;
        try {
          lastPersisted = await gateway.saveSettings(desired);
        } catch {
          set({ settings: lastPersisted });
          notifyError("Could not save your settings");
        }
      });
      return saveQueue;
    }

    return {
      settings: DEFAULT_SETTINGS,
      isLoaded: false,
      isOpen: false,
      activeSection: "general",

      load: async () => {
        try {
          const loaded = mergeSettings(DEFAULT_SETTINGS, await gateway.loadSettings());
          lastPersisted = loaded;
          set({ settings: loaded, isLoaded: true });
        } catch {
          set({ isLoaded: true });
        }
      },

      update: (patch) => {
        set(({ settings }) => ({ settings: mergeSettings(settings, patch) }));
        return enqueueSave();
      },

      openSettings: (section) =>
        set(({ activeSection }) => ({ isOpen: true, activeSection: section ?? activeSection })),
      closeSettings: () => set({ isOpen: false }),
      selectSection: (section) => set({ activeSection: section }),
    };
  });
}
