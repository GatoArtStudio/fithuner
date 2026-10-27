import type {
  AppSettings,
  PreviewProvidersSettings,
  SettingsPatch,
} from "../entities/app-settings";

function mergeProviders(
  providers: PreviewProvidersSettings,
  patch: NonNullable<SettingsPatch["preview"]>["providers"],
): PreviewProvidersSettings {
  if (!patch) return providers;
  const merged = { ...providers };
  for (const name of Object.keys(patch) as (keyof PreviewProvidersSettings)[]) {
    merged[name] = { ...providers[name], ...patch[name] } as never;
  }
  return merged;
}

export function mergeSettings(settings: AppSettings, patch: SettingsPatch): AppSettings {
  const { providers: providersPatch, ...previewPatch } = patch.preview ?? {};

  return {
    appearance: { ...settings.appearance, ...patch.appearance },
    browsing: { ...settings.browsing, ...patch.browsing },
    preview: {
      ...settings.preview,
      ...previewPatch,
      providers: mergeProviders(settings.preview.providers, providersPatch),
    },
  };
}
