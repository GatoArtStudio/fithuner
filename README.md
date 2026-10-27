# Fithuner

A cross-platform file explorer focused on UI and UX, built with Tauri, React and TypeScript.

## Highlights
- Fast, virtualized folder browsing with sidebar places, breadcrumbs and back/forward history
- Open, create, rename and trash files and folders, with a context menu and inline rename
- Copy, cut, paste and move with progress, cancellation and conflict resolution (replace, skip, keep both)
- Drag and drop between folders, the sidebar and breadcrumbs, and drop files from other apps to copy them
- System clipboard integration for files
- Undo and redo (`Ctrl+Z`, `Ctrl+Shift+Z`) for rename, create, move, copy and move to trash
- Folders refresh on their own when other programs change them, and your tabs come back after a restart
- Tabs and a split view with two panes side by side: every tab keeps its own folder, history, selection and search, and files can be dragged or sent from one pane to the other
- Search by name in the current folder and its subfolders, with type filters and results that stream in while the search runs
- Command palette (`Ctrl+K`) to run any command, jump to a folder or place, or type a path
- Configurable file preview in a resizable side or bottom panel, plus Quick Look with `Space`: images, text and code with syntax highlighting, Markdown, JSON, CSV, PDF, audio, video and folders
- Settings screen (`Ctrl+,`) with theme (system, light, dark), hidden files, trash confirmation and a Preview section to switch each file type on or off and set size limits
- Updates from Settings: Fithuner tells you when a new version exists and you choose when to download and install it

## Requirements
- [Node.js](https://nodejs.org) LTS and [pnpm](https://pnpm.io)
- [Rust](https://rustup.rs) stable
- Tauri system dependencies for your OS: see the [Tauri prerequisites](https://tauri.app/start/prerequisites/)

## Getting started
```bash
pnpm install
pnpm tauri dev
```

## Scripts
| Command | Description |
| --- | --- |
| `pnpm tauri dev` | Run the desktop app with hot reload |
| `pnpm tauri build` | Build installers for the current OS |
| `pnpm dev` | Run only the web frontend in the browser (Tauri commands are unavailable) |
| `pnpm lint` | Lint the frontend |
| `pnpm typecheck` | Type-check the frontend |
| `pnpm test` | Run frontend tests |
| `cargo test --manifest-path src-tauri/Cargo.toml` | Run backend tests |

## Keyboard shortcuts
| Shortcut | Action |
| --- | --- |
| `Alt+←` / `Alt+→` | Back / forward |
| `Alt+↑` | Go to parent folder |
| Mouse back / forward buttons | Back / forward in the pane under the pointer |
| `F5` | Refresh |
| `↑` `↓` `Home` `End` | Move selection |
| `Enter` | Open selected folder |
| `Esc` | Clear selection |
| `F2` | Rename selected entry |
| `Delete` | Move selection to trash |
| `Shift+Delete` | Delete selection permanently (asks first) |
| `Ctrl+Shift+N` | New folder |
| `Ctrl+Alt+N` | New file |
| `Menu` / `Shift+F10` / right click | Context menu |
| `Ctrl+C` / `Ctrl+X` / `Ctrl+V` | Copy / cut / paste files |
| `Ctrl+,` | Open settings |
| `Ctrl+Z` / `Ctrl+Shift+Z` (or `Ctrl+Y`) | Undo / redo the last file operation |
| `Ctrl+T` / `Ctrl+W` | New tab / close tab |
| `Ctrl+Tab` / `Ctrl+Shift+Tab` (or `Ctrl+PageDown` / `Ctrl+PageUp`) | Next / previous tab |
| `Ctrl+1` ... `Ctrl+9` | Go to that tab (`Ctrl+9` goes to the last one) |
| `Ctrl+\` | Split view on / off |
| `F6` | Switch to the other pane |
| `Ctrl+F` | Search this folder and its subfolders |
| `Ctrl+K` / `Ctrl+Shift+P` | Command palette |
| `Space` | Quick Look of the selected file (`↑` `↓` browse, `Space` or `Esc` close) |
| `Alt+P` | Show or hide the preview panel |
| Drag | Move to the folder under the pointer |
| `Ctrl` + drag | Copy instead of move |
| `Esc` while dragging | Cancel the drag |

## Notes
- Copied files go to the system clipboard, so you can paste them in other file managers. The "cut" state is only known to Fithuner: pasting cut files elsewhere copies them.
- On Linux the clipboard works on X11 and Wayland. If the system clipboard is unavailable, Fithuner keeps the files in memory so copy and paste still work inside the app.
- Dragging files out of Fithuner into other apps is not supported yet.

## Tabs and split view
- Each pane has its own tab bar. A new tab opens in the folder you are in; right click a tab to duplicate it, move it to the other pane or close the others. Middle click closes a tab and dragging reorders it, or moves it to the other pane when dropped on that pane's tab bar.
- `Ctrl+\` (or the split button in the toolbar) opens a second pane on the right and `Ctrl+\` again merges the tabs back. Drag the divider, or focus it and use `←` `→`, to resize the panes between 20% and 80%.
- The pane you click is the active one: the sidebar, the preview panel, Quick Look, the keyboard shortcuts and the command palette work on its current tab.
- Drag files onto the other pane (its empty area drops into its current folder), or use "Copy to the other pane" and "Move to the other pane" in the command palette.
- Changes made in one pane refresh every pane, so a folder open in both always shows the latest files.
- The next time you open Fithuner it brings back the tabs, folders, split view and divider position you had (history, sort order and selection start clean). A folder that no longer exists opens Home instead. Turn it off in Settings > General ("Restore tabs on startup").

## Undo and redo
- `Ctrl+Z` undoes the last file operation and `Ctrl+Shift+Z` (or `Ctrl+Y`) redoes it. They are also in the command palette ("Undo moving ..."). A short message tells you what was undone.
- Covered: rename, new file or folder, move (including drag and drop between folders and panes), copy and paste, and move to trash. Permanent deletion cannot be undone, so it still asks first.
- Undo never overwrites or deletes anything for good: if the name is taken, the file changed in the meantime or it cannot be restored, you get a message and the file stays as it is. Pasting over an existing file with "replace" cannot be undone.
- Restoring from the trash works on Linux and Windows; macOS cannot restore items yet. Moving an item back to a folder on another drive is not supported.
- The last 50 operations are kept while the app is open.

## Live folder updates
- Folders that are open in any tab update by themselves when files are created, renamed or deleted by other programs, keeping your selection. Turn it off in Settings > General ("Update folders automatically").
- Only the folders you are looking at are watched (not their subfolders). Some network or virtual file systems do not report changes; press `F5` there.

## Search
- `Ctrl+F` opens the search bar. Type to search by name (case and accents are ignored; every word must appear in the name). Results appear as they are found and show the folder they are in.
- Filter by type (folders, files, images, documents, audio, video, archives, code) and choose whether to include hidden items.
- `Enter` or double click opens a result (a folder opens in the explorer), `Ctrl+Enter` shows it in its folder, `Esc` closes the search. The preview panel and Quick Look follow the selected result.
- Searches look at names only (not file contents) and stop after 10,000 results.

## Command palette
- `Ctrl+K` (or `Ctrl+Shift+P`) lists the available commands with their shortcuts. Type a few letters to filter them.
- Type a path (`/etc`, `~/Pictures`, `C:\Users`) to jump to it, pick a place or a recent folder, or choose "Search for ..." to search for the text you typed.
- Commands that need a selection only appear when something is selected.

## Preview
- Images zoom with the mouse wheel (around the pointer) and move when you drag them, in the side panel and in Quick Look. Double click or "Fit" returns to the fitted view.
- The panel follows the selected file; drag its edge (or focus it and use the arrow keys) to resize it. Move it to the bottom in Settings > Preview.
- Each file type can be turned off and has a size limit. Text is cut at the limit, PDFs and images over the limit offer "Preview anyway", and other types offer "Open with default app".
- Markdown is sanitized before it is shown, and links are never followed from the preview.
- Audio and video codecs depend on your system. On Linux you may need the GStreamer plugins for some formats.
- Office documents, archives and fonts are not previewed yet.

## Settings
Settings are saved as JSON in your OS config folder (`~/.config/fithuner/settings.json` on Linux, `%APPDATA%\fithuner` on Windows, `~/Library/Application Support/fithuner` on macOS). Missing or invalid values fall back to defaults, so deleting the file is a safe reset.

## Updates
- On startup Fithuner checks, by default, whether a new version exists (it only requests a small `latest.json`; turn it off in Settings > Updates). If there is one, the settings gear shows a dot and Settings > Updates shows the version and its release notes.
- Nothing is downloaded or installed until you press **Download update**, then **Install and restart**. "Download updates automatically" is available but off by default; even then the app never restarts on its own.
- Updates are signed and verified before they are installed. Self-updating works for AppImage (Linux), the Windows installers and the macOS app. Other installs (for example a distro package) show **Open release page** instead.

## Releasing
1. Bump the version in `package.json`, `src-tauri/Cargo.toml` and `src-tauri/tauri.conf.json` (the release workflow checks that they match the tag).
2. Merge to `main`, then push a tag such as `v0.2.0`.
3. The `Release` workflow builds Linux, Windows and macOS installers, signs the update artifacts and creates a **draft** release with `latest.json`.
4. Edit the release notes (they are shown inside the app) and **publish** the draft. Until it is published, `latest.json` is not public and apps cannot see the update.
- Signing needs the repository secrets `TAURI_SIGNING_PRIVATE_KEY` and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`. The matching public key lives in `src-tauri/tauri.conf.json`. A local `pnpm tauri build` also needs `TAURI_SIGNING_PRIVATE_KEY` because the update artifacts are signed.
- To test updates locally, debug builds accept `FITHUNER_UPDATE_ENDPOINT` (a URL to a `latest.json`) and `FITHUNER_UPDATE_PUBKEY` (the public key that signed the artifact).

## Project structure
- `src-tauri/src/domains/<scope>/`: Rust backend, hexagonal architecture per business scope
- `src/<feature>/`: React frontend, screaming architecture per feature

## License
MIT © GatoArtStudio
