# APP_SPEC.md

## 1. Product identity

- **Working name:** PDF Compare
- **Purpose:** Compare two PDF revisions locally and make visual/text changes easy to inspect.
- **Primary users:** People reviewing revised drawings, estimates, manuals, contracts, specifications, and reports.
- **Release artifacts:** `dist/index.html` and `dist/index.self-extract.html`

## 2. Core outcome

A user selects a before and after PDF, the app automatically pairs corresponding pages even when pages were inserted or removed, and the user can inspect visual and extracted-text differences without uploading files.

## 3. Core flow

1. Select/drop Before and After PDFs.
2. Load both with embedded PDF.js.
3. Extract page text and low-resolution visual signatures.
4. Match page sequences using dynamic programming.
5. Show added/removed/changed summary.
6. Inspect each page in Diff, Side, Overlay, Slider, or Blink mode.
7. Adjust visual threshold / small-region suppression / render quality.
8. Export a diff PNG or CSV report.
9. Reset with an in-app confirmation.

## 4. Functional requirements

- Local-only PDF parsing/rendering.
- Embed PDF.js support assets required for Japanese/CID fonts (CMaps, standard fonts, required WASM, ICC profiles) in a gzip-compressed asset bundle.
- Exclude PDF.js `image_decoders` and QuickJS evaluator assets because this app does not import or use them.
- Bilingual Japanese/English UI.
- Automatic inserted/deleted page-aware matching.
- Visual and text similarity in matching.
- Translation alignment before detailed pixel comparison.
- Difference regions, visual percentage, text diff.
- 50–400% viewer zoom with Fit to view and touch-friendly controls.
- Password-protected PDF prompt.
- Changed-only filtering and keyboard/mobile navigation.
- CSV report and current diff PNG export.
- Light-only UI.
- Responsive from 320px upward.
- Runtime network blocked by CSP.

## 5. Non-goals

- OCR.
- Cryptographic/signature validation.
- PDF object-level forensic diff.
- Cloud sync/accounts.
- Editing or merging source PDFs.

## 6. Privacy

PDF bytes remain in browser memory. No analytics, telemetry, upload API, or runtime fetch is used by the built artifact.

## 7. Performance

Page matching uses compact thumbnails/text fingerprints. Full-resolution difference calculation is lazy and only runs for the selected page. High-quality rendering is user-selectable.

## 8. Browser target

Current stable Chromium, Firefox, and Safari on desktop/mobile. Built `dist/index.html` must work from `file://`.

## 9. Acceptance criteria

- Template placeholders are fully replaced at build time.
- No external runtime script/style/module URL.
- CSP contains `connect-src 'none'`.
- Standard and self-extract builds use `DecompressionStream` for local gzip expansion; current evergreen browsers are the supported target.
- Self-extract loader is ASCII-only and inherits the embedded favicon.
- Same-page revisions, inserted pages, deleted pages, scanned/image pages, and text PDFs are visually comparable.
