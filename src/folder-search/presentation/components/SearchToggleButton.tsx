import { Icon } from "../../../shared/icons/Icon";
import { useSearch } from "../context/SearchContext";

export function SearchToggleButton() {
  const isOpen = useSearch((state) => state.isOpen);
  const open = useSearch((state) => state.open);
  const close = useSearch((state) => state.close);

  return (
    <button
      type="button"
      className="icon-button"
      aria-pressed={isOpen}
      aria-label="Search"
      title="Search (Ctrl+F)"
      onClick={() => (isOpen ? close() : open())}
    >
      <Icon name="search" />
    </button>
  );
}
