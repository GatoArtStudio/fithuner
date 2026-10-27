import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { vi } from "vitest";
import { createSettingsStore, SettingsProvider } from "../../../settings";
import type { SettingsPatch } from "../../../settings/domain/entities/app-settings";
import type { PreviewGateway } from "../../application/ports/preview-gateway";
import { createPreviewStore } from "../../application/stores/preview-store";
import { PreviewProvider } from "../context/PreviewContext";

export function createFakeGateway(overrides: Partial<PreviewGateway> = {}): PreviewGateway {
  return {
    readText: vi.fn().mockResolvedValue(null),
    summarizeFolder: vi.fn(),
    assetUrl: (path) => `asset://${path}`,
    ...overrides,
  };
}

export async function renderWithPreview(
  ui: ReactElement,
  { gateway = createFakeGateway(), settings }: { gateway?: PreviewGateway; settings?: SettingsPatch } = {},
) {
  const settingsStore = createSettingsStore({
    gateway: {
      loadSettings: vi.fn(),
      saveSettings: vi.fn().mockImplementation(async (saved) => saved),
    },
    notifyError: vi.fn(),
  });
  if (settings) await settingsStore.getState().update(settings);
  const previewStore = createPreviewStore();

  const result = render(
    <SettingsProvider store={settingsStore}>
      <PreviewProvider store={previewStore} gateway={gateway}>
        {ui}
      </PreviewProvider>
    </SettingsProvider>,
  );
  return { ...result, settingsStore, previewStore, gateway };
}
