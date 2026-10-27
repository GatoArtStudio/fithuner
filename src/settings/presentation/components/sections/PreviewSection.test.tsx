import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createSettingsStore } from "../../../application/stores/settings-store";
import { SettingsProvider } from "../../context/SettingsContext";
import { PreviewSection } from "./PreviewSection";

function renderSection() {
  const gateway = {
    loadSettings: vi.fn(),
    saveSettings: vi.fn().mockImplementation(async (settings) => settings),
  };
  const store = createSettingsStore({ gateway, notifyError: vi.fn() });
  render(
    <SettingsProvider store={store}>
      <PreviewSection />
    </SettingsProvider>,
  );
  return store;
}

describe("PreviewSection", () => {
  it("lists every file type with its switch", () => {
    renderSection();

    for (const label of ["Images", "Text and code", "Markdown", "JSON", "CSV and TSV", "PDF", "Audio", "Video", "Folders"]) {
      expect(screen.getByRole("switch", { name: label })).toBeTruthy();
    }
  });

  it("turns a single file type off without touching the others", () => {
    const store = renderSection();

    fireEvent.click(screen.getByRole("switch", { name: "PDF" }));

    const { providers } = store.getState().settings.preview;
    expect(providers.pdf.enabled).toBe(false);
    expect(providers.image.enabled).toBe(true);
  });

  it("commits a size limit on blur and clamps it to the allowed range", () => {
    const store = renderSection();
    const input = screen.getByLabelText("Images maximum size in megabytes");

    fireEvent.change(input, { target: { value: "999999" } });
    fireEvent.blur(input);

    expect(store.getState().settings.preview.providers.image.maxSizeMegabytes).toBe(4096);
  });

  it("restores the previous limit when the typed value is not a number", () => {
    const store = renderSection();
    const input = screen.getByLabelText("Text and code maximum size in megabytes") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);

    expect(input.value).toBe("1");
    expect(store.getState().settings.preview.providers.text.maxSizeMegabytes).toBe(1);
  });

  it("disables the dependent options when the preview is off", () => {
    renderSection();

    fireEvent.click(screen.getByRole("switch", { name: "Enable preview" }));

    expect((screen.getByRole("switch", { name: "Show preview panel" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("switch", { name: "Images" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("moves the panel to the bottom", () => {
    const store = renderSection();

    fireEvent.change(screen.getByLabelText("Panel position"), { target: { value: "bottom" } });

    expect(store.getState().settings.preview.panelPosition).toBe("bottom");
  });
});
