import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createSettingsStore, SettingsProvider } from "../../../settings";
import { createUpdatesStore } from "../../application/stores/updates-store";
import type { UpdatesGateway } from "../../application/ports/updates-gateway";
import type { AvailableUpdate } from "../../domain/entities/update";
import { UpdatesProvider } from "../context/UpdatesContext";
import { UpdateBadge } from "./UpdateBadge";
import { UpdatesSection } from "./UpdatesSection";

const update: AvailableUpdate = { version: "0.2.0", notes: "Faster previews\nBetter search", publishedAtMillis: Date.UTC(2026, 0, 15, 12) };

function renderSection(check: { currentVersion: string; available: AvailableUpdate | null } | { error: object } = { currentVersion: "0.1.0", available: update }) {
  const gateway: UpdatesGateway = {
    checkForUpdate: vi.fn().mockImplementation(async () => {
      if ("error" in check) throw check.error;
      return check;
    }),
    startDownload: vi.fn().mockResolvedValue(undefined),
    installAndRestart: vi.fn().mockResolvedValue(undefined),
    openReleasePage: vi.fn().mockResolvedValue(undefined),
    subscribeToDownload: vi.fn(),
  };
  const updatesStore = createUpdatesStore({
    gateway,
    shouldCheckOnStartup: () => true,
    shouldDownloadAutomatically: () => false,
  });
  const settingsStore = createSettingsStore({
    gateway: { loadSettings: vi.fn(), saveSettings: vi.fn().mockImplementation(async (saved) => saved) },
    notifyError: vi.fn(),
  });
  render(
    <SettingsProvider store={settingsStore}>
      <UpdatesProvider store={updatesStore}>
        <UpdatesSection />
        <UpdateBadge />
      </UpdatesProvider>
    </SettingsProvider>,
  );
  return { gateway, updatesStore, settingsStore };
}

async function checkAndShow(check?: Parameters<typeof renderSection>[0]) {
  const rendered = renderSection(check);
  fireEvent.click(screen.getByRole("button", { name: "Check for updates" }));
  await vi.waitFor(() => expect(rendered.updatesStore.getState().status.type).not.toBe("checking"));
  return rendered;
}

describe("UpdatesSection", () => {
  it("starts without having looked for updates", () => {
    renderSection();

    expect(screen.getByText("Fithuner has not looked for updates yet.")).toBeTruthy();
    expect(screen.queryByRole("img", { name: "An update is available" })).toBeNull();
  });

  it("says when the app is up to date", async () => {
    await checkAndShow({ currentVersion: "0.1.0", available: null });

    expect(screen.getByText(/You are up to date/)).toBeTruthy();
    expect(screen.getByText("0.1.0")).toBeTruthy();
  });

  it("shows the new version with its notes, a badge and a manual download button", async () => {
    const { gateway } = await checkAndShow();

    expect(screen.getByText("Version 0.2.0 is available")).toBeTruthy();
    expect(screen.getByText(/Faster previews/)).toBeTruthy();
    expect(screen.getByRole("img", { name: "An update is available" })).toBeTruthy();
    expect(gateway.startDownload).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Download update" }));
    await vi.waitFor(() => expect(gateway.startDownload).toHaveBeenCalledOnce());
  });

  it("shows the download progress", async () => {
    const { updatesStore } = await checkAndShow();
    fireEvent.click(screen.getByRole("button", { name: "Download update" }));
    await vi.waitFor(() => expect(updatesStore.getState().status.type).toBe("downloading"));

    updatesStore.getState().handleDownloadEvent({ type: "progress", progress: { downloadedBytes: 30, totalBytes: 60 } });

    expect(await screen.findByText("50%")).toBeTruthy();
    expect(screen.getByRole("progressbar", { name: "Download progress" }).getAttribute("aria-valuenow")).toBe("50");
  });

  it("asks for an explicit click before installing", async () => {
    const { updatesStore, gateway } = await checkAndShow();
    fireEvent.click(screen.getByRole("button", { name: "Download update" }));
    await vi.waitFor(() => expect(updatesStore.getState().status.type).toBe("downloading"));

    updatesStore.getState().handleDownloadEvent({ type: "finished", error: null });
    fireEvent.click(await screen.findByRole("button", { name: "Install and restart" }));

    await vi.waitFor(() => expect(gateway.installAndRestart).toHaveBeenCalledOnce());
  });

  it("offers a retry for network errors", async () => {
    const { gateway } = await checkAndShow({ error: { kind: "network", message: "offline" } });

    expect(screen.getByRole("alert").textContent).toContain("connection");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    await vi.waitFor(() => expect(gateway.checkForUpdate).toHaveBeenCalledTimes(2));
  });

  it("offers the release page instead of a retry when the installation cannot update itself", async () => {
    const { gateway } = await checkAndShow({ error: { kind: "notSupported", message: "no" } });

    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Open release page" }));

    await vi.waitFor(() => expect(gateway.openReleasePage).toHaveBeenCalledOnce());
  });

  it("saves the two update preferences", async () => {
    const { settingsStore } = renderSection();

    fireEvent.click(screen.getByRole("switch", { name: "Download updates automatically" }));
    fireEvent.click(screen.getByRole("switch", { name: "Check for updates on startup" }));

    expect(settingsStore.getState().settings.updates).toEqual({ checkOnStartup: false, autoDownload: true });
  });

  it("shows the defaults: startup check on and automatic download off", () => {
    renderSection();

    expect(screen.getByRole("switch", { name: "Check for updates on startup" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("switch", { name: "Download updates automatically" }).getAttribute("aria-checked")).toBe("false");
  });
});
