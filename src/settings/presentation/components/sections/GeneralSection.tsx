import { useSettings } from "../../context/SettingsContext";
import { SettingToggle } from "../SettingToggle";

export function GeneralSection() {
  const browsing = useSettings((state) => state.settings.browsing);
  const update = useSettings((state) => state.update);

  return (
    <>
      <SettingToggle
        label="Show hidden files"
        description="Hidden files and folders are visible by default when you open a folder."
        checked={browsing.showHiddenFiles}
        onChange={(showHiddenFiles) => void update({ browsing: { showHiddenFiles } })}
      />
      <SettingToggle
        label="Confirm before moving to trash"
        description="Ask for confirmation when you press Delete. Permanent deletion always asks."
        checked={browsing.confirmBeforeTrash}
        onChange={(confirmBeforeTrash) => void update({ browsing: { confirmBeforeTrash } })}
      />
      <SettingToggle
        label="Restore tabs on startup"
        description="Reopen the tabs, folders and split view you had when you closed Fithuner."
        checked={browsing.restoreTabsOnStartup}
        onChange={(restoreTabsOnStartup) => void update({ browsing: { restoreTabsOnStartup } })}
      />
      <SettingToggle
        label="Update folders automatically"
        description="Show files created, renamed or deleted by other programs without refreshing."
        checked={browsing.watchFolders}
        onChange={(watchFolders) => void update({ browsing: { watchFolders } })}
      />
    </>
  );
}
