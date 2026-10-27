import { Icon } from "../../../shared/icons/Icon";
import { usePreviewLayout } from "../hooks/usePreviewLayout";

export function PreviewToggleButton() {
  const { isPanelVisible, isPreviewEnabled, togglePanel } = usePreviewLayout();

  return (
    <button
      type="button"
      className="icon-button"
      aria-pressed={isPanelVisible}
      disabled={!isPreviewEnabled}
      title={isPanelVisible ? "Hide preview panel (Alt+P)" : "Show preview panel (Alt+P)"}
      aria-label="Preview panel"
      onClick={togglePanel}
    >
      <Icon name="preview" />
    </button>
  );
}
