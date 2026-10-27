# Fithuner

A cross-platform file explorer focused on UI and UX, built with Tauri, React and TypeScript.

## Highlights
- Fast, virtualized folder browsing with sidebar places, breadcrumbs and back/forward history
- Open, create, rename and trash files and folders, with a context menu and inline rename
- Copy, cut, paste and move with progress, cancellation and conflict resolution (replace, skip, keep both)
- Drag and drop between folders, the sidebar and breadcrumbs, and drop files from other apps to copy them
- System clipboard integration for files
- Configurable file preview (planned): images, text/code, PDF, audio, video, Markdown, JSON, CSV, folders
- Settings screen to enable, disable or tune features (planned)
- Automatic updates (planned)

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
| Drag | Move to the folder under the pointer |
| `Ctrl` + drag | Copy instead of move |
| `Esc` while dragging | Cancel the drag |

## Notes
- Copied files go to the system clipboard, so you can paste them in other file managers. The "cut" state is only known to Fithuner: pasting cut files elsewhere copies them.
- On Linux the clipboard works on X11 and Wayland. If the system clipboard is unavailable, Fithuner keeps the files in memory so copy and paste still work inside the app.
- Dragging files out of Fithuner into other apps is not supported yet.

## Project structure
- `src-tauri/src/domains/<scope>/`: Rust backend, hexagonal architecture per business scope
- `src/<feature>/`: React frontend, screaming architecture per feature

## License
MIT © GatoArtStudio
