# AGENTS.md

This repository is based on `ttomohisa/htmlapps-template`.

## Product rules

- Keep the deliverable a fully self-contained single HTML application.
- Do not add runtime network access, analytics, telemetry, login, cloud storage, or CDN dependencies.
- Keep Japanese and English UI synchronized.
- Keep the light-only visual language and compact header controls.
- Do not add dark mode.
- Update the in-app “How to use & notes” content whenever user-facing behavior changes.
- Prefer mobile usability, safe areas, and touch targets.
- Destructive reset must use the app-provided dialog, not `window.confirm()`.
- PDF bytes must never leave the browser.

## Build rules

- `src/index.template.html` contains exactly one of each build placeholder.
- Dependencies are pinned in `dependencies.json`.
- `build-standalone.ps1` produces `dist/index.html` and the self-extracting variant.
- `scripts/build-self-extract.ps1` must remain ASCII-only for Windows PowerShell 5.1.
- Keep `connect-src 'none'`.
