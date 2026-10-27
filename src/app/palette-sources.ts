import { expandHome, isPathLike, type PaletteItem } from "../command-palette";
import type { FileClipboardStore } from "../file-clipboard";
import { fileNameOf, type FileOperationsStore } from "../file-operations";
import type { PreviewStore } from "../file-preview";
import { selectCanGoBack, selectCanGoForward, type PlacesStore } from "../navigation";
import type { SettingsStore } from "../settings";
import type { UpdatesStore } from "../app-updates";
import type { FileTransferStore } from "../file-transfer";
import type { WorkspaceStore } from "../workspace";
import { selectRedoLabel, selectUndoLabel, type UndoStore } from "../undo-history";
import type { BrowsingSession } from "./browsing-session";
import { command } from "./palette-command";
import { buildWorkspaceCommands } from "./palette-workspace-commands";

export type PaletteSession = Pick<BrowsingSession, "directoryBrowsingStore" | "navigationStore" | "searchStore">;

export interface PaletteStores {
  activeSession: () => PaletteSession;
  placesStore: PlacesStore;
  fileOperationsStore: FileOperationsStore;
  fileClipboardStore: FileClipboardStore;
  settingsStore: SettingsStore;
  previewStore: PreviewStore;
  updatesStore: UpdatesStore;
  workspaceStore: WorkspaceStore<BrowsingSession>;
  fileTransferStore: FileTransferStore;
  undoStore: UndoStore;
}

const RECENT_FOLDERS_LIMIT = 10;

function buildCommands(stores: PaletteStores): PaletteItem[] {
  const session = stores.activeSession();
  const directory = session.directoryBrowsingStore.getState();
  const navigation = session.navigationStore.getState();
  const settings = stores.settingsStore.getState();
  const preview = settings.settings.preview;
  const isSearchOpen = session.searchStore.getState().isOpen;
  const hasSelection = directory.selectedPaths.length > 0 && !isSearchOpen;
  const { fileOperationsStore, fileClipboardStore, undoStore } = stores;
  const undoLabel = selectUndoLabel(undoStore.getState());
  const redoLabel = selectRedoLabel(undoStore.getState());

  const commands = [
    command("new-folder", "New folder", () => void fileOperationsStore.getState().createEntry("directory"), {
      shortcut: "Ctrl+Shift+N",
      keywords: ["create", "directory", "mkdir"],
      isAvailable: !isSearchOpen,
    }),
    command("new-file", "New file", () => void fileOperationsStore.getState().createEntry("file"), {
      shortcut: "Ctrl+Alt+N",
      keywords: ["create", "touch"],
      isAvailable: !isSearchOpen,
    }),
    command("rename", "Rename", () => fileOperationsStore.getState().startRename(), {
      shortcut: "F2",
      isAvailable: hasSelection,
    }),
    command("trash", "Move to trash", () => void fileOperationsStore.getState().trashSelected(), {
      shortcut: "Delete",
      keywords: ["delete", "remove", "bin"],
      isAvailable: hasSelection,
    }),
    command("delete", "Delete permanently", () => fileOperationsStore.getState().requestPermanentDelete(), {
      shortcut: "Shift+Delete",
      keywords: ["remove", "erase"],
      isAvailable: hasSelection,
    }),
    command("copy", "Copy", () => void fileClipboardStore.getState().copySelected(), {
      shortcut: "Ctrl+C",
      isAvailable: hasSelection,
    }),
    command("cut", "Cut", () => void fileClipboardStore.getState().cutSelected(), {
      shortcut: "Ctrl+X",
      keywords: ["move"],
      isAvailable: hasSelection,
    }),
    command("paste", "Paste", () => void fileClipboardStore.getState().paste(), {
      shortcut: "Ctrl+V",
      isAvailable: !isSearchOpen,
    }),
    command("undo", `Undo ${undoLabel}`, () => void undoStore.getState().undo(), {
      shortcut: "Ctrl+Z",
      isAvailable: undoLabel !== null,
    }),
    command("redo", `Redo ${redoLabel}`, () => void undoStore.getState().redo(), {
      shortcut: "Ctrl+Shift+Z",
      isAvailable: redoLabel !== null,
    }),
    command("refresh", "Refresh", () => void directory.refresh(), { shortcut: "F5", keywords: ["reload"] }),
    command("back", "Go back", () => void navigation.goBack(), {
      shortcut: "Alt+←",
      isAvailable: selectCanGoBack(navigation),
    }),
    command("forward", "Go forward", () => void navigation.goForward(), {
      shortcut: "Alt+→",
      isAvailable: selectCanGoForward(navigation),
    }),
    command(
      "up",
      "Go to parent folder",
      () => void navigation.navigateTo(directory.listing?.parentPath ?? undefined),
      { shortcut: "Alt+↑", keywords: ["up", "parent"], isAvailable: Boolean(directory.listing?.parentPath) },
    ),
    command(
      "hidden",
      directory.showHidden ? "Hide hidden files" : "Show hidden files",
      () => directory.toggleShowHidden(),
      { keywords: ["dotfiles", "toggle"] },
    ),
    command(
      "preview-panel",
      "Toggle preview panel",
      () => void settings.update({ preview: { showPanel: !preview.showPanel } }),
      { shortcut: "Alt+P", keywords: ["show", "hide"], isAvailable: preview.panelEnabled },
    ),
    command("quick-look", "Quick Look", () => stores.previewStore.getState().openQuickLook(), {
      shortcut: "Space",
      keywords: ["preview"],
      isAvailable: preview.panelEnabled && preview.quickLookEnabled && directory.selectedPaths.length === 1 && !isSearchOpen,
    }),
    command("sort-name", "Sort by name", () => directory.toggleSort("name"), { keywords: ["order"], isAvailable: !isSearchOpen }),
    command("sort-size", "Sort by size", () => directory.toggleSort("size"), { keywords: ["order"], isAvailable: !isSearchOpen }),
    command("sort-modified", "Sort by modified date", () => directory.toggleSort("modified"), {
      keywords: ["order", "date"],
      isAvailable: !isSearchOpen,
    }),
    command("sort-type", "Sort by type", () => directory.toggleSort("type"), { keywords: ["order"], isAvailable: !isSearchOpen }),
    command("search", "Search in this folder", () => session.searchStore.getState().open(), {
      shortcut: "Ctrl+F",
      keywords: ["find"],
    }),
    command("settings", "Open settings", () => settings.openSettings(), { shortcut: "Ctrl+,", keywords: ["preferences", "options"] }),
    command(
      "updates",
      "Check for updates",
      () => {
        settings.openSettings("updates");
        void stores.updatesStore.getState().checkNow();
      },
      { keywords: ["upgrade", "version"] },
    ),
  ];

  return [...commands, ...buildWorkspaceCommands(stores)].filter((item): item is PaletteItem => item !== null);
}

function buildPlaces(stores: PaletteStores): PaletteItem[] {
  const session = stores.activeSession();
  const { history } = session.navigationStore.getState();
  const { places } = stores.placesStore.getState();
  const navigateTo = (path: string) => () => void session.navigationStore.getState().navigateTo(path);
  const currentPath = session.directoryBrowsingStore.getState().listing?.path;

  const placeItems: PaletteItem[] = places.map((place) => ({
    id: `place:${place.path}`,
    title: `Go to ${place.label}`,
    subtitle: place.path,
    group: "places",
    keywords: [place.label, place.path],
    run: navigateTo(place.path),
  }));

  const knownPaths = new Set([...places.map((place) => place.path), currentPath]);
  const recentPaths = [...new Set([...history.paths].reverse())]
    .filter((path) => !knownPaths.has(path))
    .slice(0, RECENT_FOLDERS_LIMIT);
  const recentItems: PaletteItem[] = recentPaths.map((path) => ({
    id: `recent:${path}`,
    title: `Go to ${fileNameOf(path) || path}`,
    subtitle: `Recent · ${path}`,
    group: "places",
    keywords: [path],
    run: navigateTo(path),
  }));

  return [...placeItems, ...recentItems];
}

function buildTypedTextItems(stores: PaletteStores, query: string): PaletteItem[] {
  const text = query.trim();
  if (text === "") return [];
  const session = stores.activeSession();

  if (isPathLike(text)) {
    const homePath = stores.placesStore.getState().places.find((place) => place.kind === "home")?.path ?? null;
    const path = expandHome(text, homePath);
    return [
      {
        id: "go-to-path",
        title: `Go to ${path}`,
        subtitle: "Open this folder",
        group: "go-to-path",
        alwaysVisible: true,
        run: () => void session.navigationStore.getState().navigateTo(path),
      },
    ];
  }

  const folderName = fileNameOf(session.directoryBrowsingStore.getState().listing?.path ?? "/") || "this folder";
  return [
    {
      id: "search-for-text",
      title: `Search for “${text}” in ${folderName}`,
      group: "search",
      alwaysVisible: true,
      run: () => session.searchStore.getState().open(text),
    },
  ];
}

export function buildPaletteItems(stores: PaletteStores, query: string): PaletteItem[] {
  return [...buildTypedTextItems(stores, query), ...buildCommands(stores), ...buildPlaces(stores)];
}
