import { createStore, type StoreApi } from "zustand/vanilla";
import type {
  AvailableUpdate,
  DownloadEvent,
  UpdateError,
  UpdateStatus,
  UpdateStep,
} from "../../domain/entities/update";
import type { UpdatesGateway } from "../ports/updates-gateway";

export interface UpdatesState {
  currentVersion: string | null;
  status: UpdateStatus;
  lastCheckedAtMillis: number | null;
  runStartupCheck: () => Promise<void>;
  checkNow: () => Promise<void>;
  download: () => Promise<void>;
  installAndRestart: () => Promise<void>;
  openReleasePage: () => Promise<void>;
  handleDownloadEvent: (event: DownloadEvent) => void;
}

export type UpdatesStore = StoreApi<UpdatesState>;

export interface UpdatesDependencies {
  gateway: UpdatesGateway;
  shouldCheckOnStartup: () => boolean;
  shouldDownloadAutomatically: () => boolean;
  notifyReady?: (version: string) => void;
  now?: () => number;
}

function toUpdateError(failure: unknown): UpdateError {
  if (typeof failure === "object" && failure !== null && "kind" in failure && "message" in failure) {
    return failure as UpdateError;
  }
  return { kind: "unexpected", message: "Something went wrong while updating" };
}

export function selectHasPendingUpdate(state: UpdatesState): boolean {
  const { type } = state.status;
  return type === "available" || type === "downloading" || type === "ready";
}

export function createUpdatesStore({
  gateway,
  shouldCheckOnStartup,
  shouldDownloadAutomatically,
  notifyReady,
  now = Date.now,
}: UpdatesDependencies): UpdatesStore {
  return createStore<UpdatesState>((set, get) => {
    function fail(step: UpdateStep, failure: unknown, update: AvailableUpdate | null) {
      set({ status: { type: "error", step, error: toUpdateError(failure), update } });
    }

    function currentUpdate(): AvailableUpdate | null {
      const { status } = get();
      return "update" in status ? status.update : null;
    }

    async function checkNow() {
      const { type } = get().status;
      if (type === "checking" || type === "downloading" || type === "installing" || type === "ready") return;

      set({ status: { type: "checking" } });
      try {
        const result = await gateway.checkForUpdate();
        set({
          currentVersion: result.currentVersion,
          lastCheckedAtMillis: now(),
          status: result.available
            ? { type: "available", update: result.available }
            : { type: "up-to-date" },
        });
      } catch (failure) {
        set({ lastCheckedAtMillis: now() });
        fail("check", failure, null);
        return;
      }
      if (get().status.type === "available" && shouldDownloadAutomatically()) await get().download();
    }

    return {
      currentVersion: null,
      status: { type: "idle" },
      lastCheckedAtMillis: null,

      runStartupCheck: async () => {
        if (shouldCheckOnStartup()) await checkNow();
      },

      checkNow,

      download: async () => {
        const { status } = get();
        const update = status.type === "available" || status.type === "error" ? currentUpdate() : null;
        if (!update) return;

        set({ status: { type: "downloading", update, progress: null } });
        try {
          await gateway.startDownload();
        } catch (failure) {
          fail("download", failure, update);
        }
      },

      installAndRestart: async () => {
        const { status } = get();
        const update = status.type === "ready" || (status.type === "error" && status.step === "install")
          ? currentUpdate()
          : null;
        if (!update) return;

        set({ status: { type: "installing", update } });
        try {
          await gateway.installAndRestart();
        } catch (failure) {
          fail("install", failure, update);
        }
      },

      openReleasePage: async () => {
        try {
          await gateway.openReleasePage();
        } catch {
          // Opening the browser is best effort; the status stays as it was.
        }
      },

      handleDownloadEvent: (event) => {
        const { status } = get();
        if (status.type !== "downloading") return;

        if (event.type === "progress") {
          set({ status: { ...status, progress: event.progress } });
        } else if (event.error) {
          fail("download", event.error, status.update);
        } else {
          set({ status: { type: "ready", update: status.update } });
          notifyReady?.(status.update.version);
        }
      },
    };
  });
}
