import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createSettingsStore } from "../../application/stores/settings-store";
import { SettingsProvider } from "../context/SettingsContext";
import { SettingsView } from "./SettingsView";

function renderView() {
  const gateway = {
    loadSettings: vi.fn(),
    saveSettings: vi.fn().mockImplementation(async (settings) => settings),
  };
  const store = createSettingsStore({ gateway, notifyError: vi.fn() });
  store.getState().openSettings();
  render(
    <SettingsProvider store={store}>
      <SettingsView />
    </SettingsProvider>,
  );
  return { store, gateway };
}

describe("SettingsView", () => {
  it("shows the general section first", () => {
    renderView();

    expect(screen.getByRole("heading", { name: "General" })).toBeTruthy();
    expect(screen.getByRole("switch", { name: "Show hidden files" }).getAttribute("aria-checked")).toBe("false");
  });

  it("persists a toggled setting", async () => {
    const { store, gateway } = renderView();

    fireEvent.click(screen.getByRole("switch", { name: "Confirm before moving to trash" }));

    expect(store.getState().settings.browsing.confirmBeforeTrash).toBe(true);
    await vi.waitFor(() => expect(gateway.saveSettings).toHaveBeenCalled());
  });

  it("switches to the appearance section and changes the theme", () => {
    const { store } = renderView();

    fireEvent.click(screen.getByRole("button", { name: "Appearance" }));
    fireEvent.change(screen.getByLabelText("Theme"), { target: { value: "dark" } });

    expect(screen.getByRole("heading", { name: "Appearance" })).toBeTruthy();
    expect(store.getState().settings.appearance.theme).toBe("dark");
  });

  it("closes with the back button and with Escape", () => {
    const { store } = renderView();

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(store.getState().isOpen).toBe(false);

    store.getState().openSettings();
    fireEvent.keyDown(screen.getByRole("heading", { name: "General" }), { key: "Escape" });
    expect(store.getState().isOpen).toBe(false);
  });
});
