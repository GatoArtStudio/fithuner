import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createSettingsStore } from "../../application/stores/settings-store";
import { SettingsProvider } from "../context/SettingsContext";
import { useApplyTheme } from "./useApplyTheme";

function ThemeProbe() {
  useApplyTheme();
  return null;
}

afterEach(() => document.documentElement.removeAttribute("data-theme"));

describe("useApplyTheme", () => {
  it("sets the theme attribute for explicit themes and removes it for the system theme", async () => {
    const store = createSettingsStore({
      gateway: {
        loadSettings: vi.fn(),
        saveSettings: vi.fn().mockImplementation(async (settings) => settings),
      },
      notifyError: vi.fn(),
    });
    render(
      <SettingsProvider store={store}>
        <ThemeProbe />
      </SettingsProvider>,
    );
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);

    await act(() => store.getState().update({ appearance: { theme: "dark" } }));
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    await act(() => store.getState().update({ appearance: { theme: "system" } }));
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });
});
