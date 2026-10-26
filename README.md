# Fithuner

A cross-platform file explorer focused on UI and UX, built with Tauri, React and TypeScript.

## Highlights
- Fast, virtualized folder browsing with sidebar places, breadcrumbs and back/forward history
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

## Project structure
- `src-tauri/src/domains/<scope>/`: Rust backend, hexagonal architecture per business scope
- `src/<feature>/`: React frontend, screaming architecture per feature

## License
MIT © GatoArtStudio
