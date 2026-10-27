import { describe, expect, it, vi } from "vitest";
import type { AvailableUpdate, UpdateCheckResult } from "../../domain/entities/update";
import type { UpdatesGateway } from "../ports/updates-gateway";
import { createUpdatesStore, selectHasPendingUpdate } from "./updates-store";

const update: AvailableUpdate = { version: "0.2.0", notes: "Faster previews", publishedAtMillis: 1_700_000_000_000 };
const newer: UpdateCheckResult = { currentVersion: "0.1.0", available: update };
const upToDate: UpdateCheckResult = { currentVersion: "0.1.0", available: null };

function setup(options: { check?: UpdateCheckResult | Error; checkOnStartup?: boolean; autoDownload?: boolean } = {}) {
  const check = options.check ?? newer;
  const gateway: UpdatesGateway = {
    checkForUpdate: vi.fn().mockImplementation(async () => {
      if (check instanceof Error) throw { kind: "network", message: check.message };
      return check;
    }),
    startDownload: vi.fn().mockResolvedValue(undefined),
    installAndRestart: vi.fn().mockResolvedValue(undefined),
    openReleasePage: vi.fn().mockResolvedValue(undefined),
    subscribeToDownload: vi.fn(),
  };
  const notifyReady = vi.fn();
  const store = createUpdatesStore({
    gateway,
    shouldCheckOnStartup: () => options.checkOnStartup ?? true,
    shouldDownloadAutomatically: () => options.autoDownload ?? false,
    notifyReady,
    now: () => 5000,
  });
  return { store, gateway, notifyReady };
}

describe("updates store: checking", () => {
  it("reports an available update and remembers the version and the time of the check", async () => {
    const { store } = setup();

    await store.getState().checkNow();

    expect(store.getState().status).toEqual({ type: "available", update });
    expect(store.getState().currentVersion).toBe("0.1.0");
    expect(store.getState().lastCheckedAtMillis).toBe(5000);
    expect(selectHasPendingUpdate(store.getState())).toBe(true);
  });

  it("reports when the app is up to date", async () => {
    const { store } = setup({ check: upToDate });

    await store.getState().checkNow();

    expect(store.getState().status).toEqual({ type: "up-to-date" });
    expect(selectHasPendingUpdate(store.getState())).toBe(false);
  });

  it("keeps a check failure as an inline error instead of throwing", async () => {
    const { store } = setup({ check: new Error("offline") });

    await store.getState().checkNow();

    expect(store.getState().status).toMatchObject({ type: "error", step: "check", error: { kind: "network" } });
  });

  it("checks at startup only when the setting is on", async () => {
    const enabled = setup();
    const disabled = setup({ checkOnStartup: false });

    await enabled.store.getState().runStartupCheck();
    await disabled.store.getState().runStartupCheck();

    expect(enabled.gateway.checkForUpdate).toHaveBeenCalledOnce();
    expect(disabled.gateway.checkForUpdate).not.toHaveBeenCalled();
    expect(disabled.store.getState().status).toEqual({ type: "idle" });
  });

  it("never downloads on its own unless automatic mode is on", async () => {
    const manual = setup();
    const automatic = setup({ autoDownload: true });

    await manual.store.getState().checkNow();
    await automatic.store.getState().checkNow();

    expect(manual.gateway.startDownload).not.toHaveBeenCalled();
    expect(automatic.gateway.startDownload).toHaveBeenCalledOnce();
    expect(automatic.store.getState().status.type).toBe("downloading");
  });

  it("does not check again while a download is running or an update is ready", async () => {
    const { store, gateway } = setup();
    await store.getState().checkNow();
    await store.getState().download();

    await store.getState().checkNow();

    expect(gateway.checkForUpdate).toHaveBeenCalledOnce();
  });
});

describe("updates store: downloading and installing", () => {
  it("downloads only when the user asks and tracks progress", async () => {
    const { store, gateway } = setup();
    await store.getState().checkNow();

    await store.getState().download();
    store.getState().handleDownloadEvent({ type: "progress", progress: { downloadedBytes: 40, totalBytes: 100 } });

    expect(gateway.startDownload).toHaveBeenCalledOnce();
    expect(store.getState().status).toEqual({
      type: "downloading",
      update,
      progress: { downloadedBytes: 40, totalBytes: 100 },
    });
  });

  it("becomes ready and tells the user when the download finishes", async () => {
    const { store, notifyReady } = setup();
    await store.getState().checkNow();
    await store.getState().download();

    store.getState().handleDownloadEvent({ type: "finished", error: null });

    expect(store.getState().status).toEqual({ type: "ready", update });
    expect(notifyReady).toHaveBeenCalledWith("0.2.0");
  });

  it("keeps the update and allows retrying when the download fails", async () => {
    const { store, gateway } = setup();
    await store.getState().checkNow();
    await store.getState().download();

    store.getState().handleDownloadEvent({ type: "finished", error: { kind: "invalidSignature", message: "bad" } });
    expect(store.getState().status).toMatchObject({ type: "error", step: "download", update });

    await store.getState().download();
    expect(gateway.startDownload).toHaveBeenCalledTimes(2);
  });

  it("ignores download events when no download is running", async () => {
    const { store } = setup();

    store.getState().handleDownloadEvent({ type: "finished", error: null });

    expect(store.getState().status).toEqual({ type: "idle" });
  });

  it("installs only a downloaded update", async () => {
    const { store, gateway } = setup();
    await store.getState().checkNow();

    await store.getState().installAndRestart();
    expect(gateway.installAndRestart).not.toHaveBeenCalled();

    await store.getState().download();
    store.getState().handleDownloadEvent({ type: "finished", error: null });
    await store.getState().installAndRestart();

    expect(gateway.installAndRestart).toHaveBeenCalledOnce();
    expect(store.getState().status).toEqual({ type: "installing", update });
  });

  it("reports an installation that fails and lets the user retry", async () => {
    const { store, gateway } = setup();
    vi.mocked(gateway.installAndRestart).mockRejectedValueOnce({ kind: "notSupported", message: "no" });
    await store.getState().checkNow();
    await store.getState().download();
    store.getState().handleDownloadEvent({ type: "finished", error: null });

    await store.getState().installAndRestart();
    expect(store.getState().status).toMatchObject({ type: "error", step: "install", error: { kind: "notSupported" } });

    await store.getState().installAndRestart();
    expect(gateway.installAndRestart).toHaveBeenCalledTimes(2);
  });

  it("opens the release page without changing the status", async () => {
    const { store, gateway } = setup();
    await store.getState().checkNow();

    await store.getState().openReleasePage();

    expect(gateway.openReleasePage).toHaveBeenCalledOnce();
    expect(store.getState().status.type).toBe("available");
  });
});
