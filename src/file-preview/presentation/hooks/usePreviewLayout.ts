import { useSettings } from "../../../settings";

export function usePreviewLayout() {
  const preview = useSettings((state) => state.settings.preview);
  const update = useSettings((state) => state.update);

  return {
    isPanelVisible: preview.panelEnabled && preview.showPanel,
    isPreviewEnabled: preview.panelEnabled,
    isQuickLookEnabled: preview.panelEnabled && preview.quickLookEnabled,
    position: preview.panelPosition,
    sizePx: preview.panelSizePx,
    hidePanel: () => void update({ preview: { showPanel: false } }),
    togglePanel: () => void update({ preview: { showPanel: !preview.showPanel } }),
    resizePanel: (panelSizePx: number) => void update({ preview: { panelSizePx } }),
  };
}
