import type {
  PanelPosition,
  PreviewProvidersSettings,
} from "../../../domain/entities/app-settings";
import { useSettings } from "../../context/SettingsContext";
import { SettingProviderRow } from "../SettingProviderRow";
import { SettingSelect } from "../SettingSelect";
import { SettingToggle } from "../SettingToggle";
import controlStyles from "../SettingControls.module.css";

const POSITION_OPTIONS: { value: PanelPosition; label: string }[] = [
  { value: "right", label: "Right" },
  { value: "bottom", label: "Bottom" },
];

const PROVIDERS: {
  key: keyof PreviewProvidersSettings;
  label: string;
  description: string;
  hasSizeLimit: boolean;
}[] = [
  { key: "image", label: "Images", description: "PNG, JPG, GIF, WebP, SVG, BMP, ICO and AVIF.", hasSizeLimit: true },
  { key: "text", label: "Text and code", description: "Plain text and source code with syntax highlighting. Larger files are cut at the size limit.", hasSizeLimit: true },
  { key: "markdown", label: "Markdown", description: "Rendered Markdown documents.", hasSizeLimit: true },
  { key: "json", label: "JSON", description: "Collapsible JSON tree.", hasSizeLimit: true },
  { key: "csv", label: "CSV and TSV", description: "Tables from delimited text files.", hasSizeLimit: true },
  { key: "pdf", label: "PDF", description: "PDF documents rendered page by page.", hasSizeLimit: true },
  { key: "audio", label: "Audio", description: "Play audio files. Formats depend on your system.", hasSizeLimit: false },
  { key: "video", label: "Video", description: "Play video files. Formats depend on your system.", hasSizeLimit: false },
  { key: "folder", label: "Folders", description: "Item count and total size of a folder.", hasSizeLimit: false },
];

export function PreviewSection() {
  const preview = useSettings((state) => state.settings.preview);
  const update = useSettings((state) => state.update);
  const isPanelAvailable = preview.panelEnabled;

  return (
    <>
      <SettingToggle
        label="Enable preview"
        description="Turn the whole preview feature on or off, including Quick Look."
        checked={preview.panelEnabled}
        onChange={(panelEnabled) => void update({ preview: { panelEnabled } })}
      />
      <SettingToggle
        label="Show preview panel"
        description="Keep the panel open next to your files. Toggle it any time with Alt+P."
        checked={preview.showPanel}
        disabled={!isPanelAvailable}
        onChange={(showPanel) => void update({ preview: { showPanel } })}
      />
      <SettingSelect
        label="Panel position"
        description="Where the preview panel appears."
        value={preview.panelPosition}
        options={POSITION_OPTIONS}
        disabled={!isPanelAvailable}
        onChange={(panelPosition) => void update({ preview: { panelPosition } })}
      />
      <SettingToggle
        label="Quick Look with Space"
        description="Press Space on a selected file for a large preview."
        checked={preview.quickLookEnabled}
        disabled={!isPanelAvailable}
        onChange={(quickLookEnabled) => void update({ preview: { quickLookEnabled } })}
      />
      <h2 className={controlStyles.groupTitle}>File types</h2>
      {PROVIDERS.map((provider) => {
        const settings = preview.providers[provider.key];
        return (
          <SettingProviderRow
            key={provider.key}
            label={provider.label}
            description={provider.description}
            enabled={settings.enabled}
            maxSizeMegabytes={provider.hasSizeLimit ? (settings as { maxSizeMegabytes: number }).maxSizeMegabytes : undefined}
            disabled={!isPanelAvailable}
            onEnabledChange={(enabled) =>
              void update({ preview: { providers: { [provider.key]: { enabled } } } })
            }
            onMaxSizeChange={(maxSizeMegabytes) =>
              void update({ preview: { providers: { [provider.key]: { maxSizeMegabytes } } } })
            }
          />
        );
      })}
    </>
  );
}
