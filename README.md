# Fithuner

A cross-platform file explorer focused on UI and UX, built with Tauri, React and TypeScript.

## Highlights
- Fast, virtualized folder browsing with sidebar places, breadcrumbs and back/forward history
- Open, create, rename and trash files and folders, with a context menu and inline rename
- Copy, cut, paste and move with progress, cancellation and conflict resolution (replace, skip, keep both)
- Drag and drop between folders, the sidebar and breadcrumbs, and drop files from other apps to copy them
- System clipboard integration for files
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
| `Space` | Quick Look of the selected file (`↑` `↓` browse, `Space` or `Esc` close) |
| `Alt+P` | Show or hide the preview panel |
| Drag | Move to the folder under the pointer |
| `Ctrl` + drag | Copy instead of move |
| `Esc` while dragging | Cancel the drag |

## Notes
- Copied files go to the system clipboard, so you can paste them in other file managers. The "cut" state is only known to Fithuner: pasting cut files elsewhere copies them.
- On Linux the clipboard works on X11 and Wayland. If the system clipboard is unavailable, Fithuner keeps the files in memory so copy and paste still work inside the app.
- Dragging files out of Fithuner into other apps is not supported yet.

## Preview
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
