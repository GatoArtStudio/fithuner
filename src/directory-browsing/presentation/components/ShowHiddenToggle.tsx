import { Icon } from "../../../shared/icons/Icon";
import { useDirectoryBrowsing } from "../context/DirectoryBrowsingContext";

export function ShowHiddenToggle() {
  const showHidden = useDirectoryBrowsing((state) => state.showHidden);
  const toggleShowHidden = useDirectoryBrowsing((state) => state.toggleShowHidden);

  return (
    <button
      type="button"
      className="icon-button"
      aria-pressed={showHidden}
      title={showHidden ? "Hide hidden files" : "Show hidden files"}
      onClick={toggleShowHidden}
    >
      <Icon name={showHidden ? "eye" : "eyeOff"} />
    </button>
  );
}
