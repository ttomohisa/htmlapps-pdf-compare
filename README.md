# PDF Compare

[![GitHub Pages](https://github.com/ttomohisa/htmlapps-pdf-compare/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/ttomohisa/htmlapps-pdf-compare/actions/workflows/deploy-pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Single HTML](https://img.shields.io/badge/distribution-single%20HTML-0ea5e9)](https://ttomohisa.github.io/htmlapps-pdf-compare/)

[日本語版 README](README.ja.md)

A privacy-focused, single-HTML app for comparing two PDF revisions entirely in the browser. It detects inserted and removed pages, visual changes, and extracted-text differences without uploading the selected PDFs to a server.

Instead of blindly comparing page 1 with page 1, page 2 with page 2, and so on, PDF Compare uses both page appearance and extracted text to align the two document revisions. This keeps an inserted or removed page from making every following page look changed.

## 🚀 Live demo

### [Open PDF Compare on GitHub Pages](https://ttomohisa.github.io/htmlapps-pdf-compare/)

GitHub Pages delivers the initial HTML. After it loads, PDF parsing, page analysis, rendering, page matching, and difference calculation run locally on your device. The PDFs you select are not uploaded by the app.

## Features

- Compare Before and After PDFs entirely in the browser
- Automatically match pages using visual and extracted-text similarity
- Detect inserted and removed pages
- Automatically correct small translation offsets before calculating visual differences
- Five comparison views: **Diff, Side by side, Overlay, Slider, Blink**
- Show visual-difference percentage, text similarity, and alignment offset per page
- Group nearby changed pixels into clickable change regions
- Show extracted-text differences when text is available in the PDF
- Filter the page list to changed pages only
- Tune the visual difference threshold and ignore tiny change regions
- Switch between Standard and High render quality
- **50–400% viewer zoom** plus Fit to view
- Zoom with `Ctrl` / `⌘` + mouse wheel
- Open password-protected PDFs
- Export the current visual diff as PNG
- Export a document-wide comparison report as CSV
- Japanese and English UI in the same HTML
- Responsive desktop and mobile layout
- Embedded SVG favicon
- Embedded PDF.js, worker, CMaps, standard fonts, WASM, ICC data, and image decoders
- Build both `dist/index.html` and `dist/index.self-extract.html`

## Quick start

### Use the web demo

Just [open the demo](https://ttomohisa.github.io/htmlapps-pdf-compare/). No installation or account is required.

### Use it fully offline (advanced)

1. Download or clone this repository.
2. Run `build-standalone.bat` on Windows.
3. The first build downloads the exact PDF.js version pinned in `dependencies.json` from the official npm registry.
4. Copy the generated `dist/index.html` wherever you need it.
5. Open that single file later without an internet connection.

```powershell
.\build-standalone.bat
```

Python, Node.js, and a local web server are not required. The builder uses Windows PowerShell and `tar.exe`.

## Usage

1. Choose the original document under **Before** and the revised document under **After**.
2. PDF Compare analyzes both files and automatically aligns pages using their appearance and extracted text.
3. Review the summary for matched pages, changed pages, inserted pages, removed pages, and overall visual change.
4. Select a page from the page list.
5. Switch among **Diff, Side by side, Overlay, Slider, and Blink** views.
6. Adjust the difference threshold, tiny-region suppression, or render quality when needed.
7. Zoom in for fine details and use a change-region button to jump to a detected area.
8. Export a Diff PNG or CSV report when useful.

### Comparison views

| View | Best for |
| --- | --- |
| **Diff** | Highlighting changed pixels and locating edits quickly |
| **Side by side** | Comparing both revisions in their natural appearance |
| **Overlay** | Seeing shifts and shape changes by stacking both pages |
| **Slider** | Moving a Before / After boundary across the page |
| **Blink** | Spotting subtle changes by alternating between revisions |

### Difference settings

- **Difference threshold:** Lower values detect subtler color and rendering changes.
- **Ignore tiny regions:** Suppresses small regions such as scan noise.
- **Render quality:** Standard is recommended for normal use; High is available for close inspection.

Before the detailed pixel comparison, PDF Compare searches for a small translation offset so a page that moved by only a few pixels does not become one giant false-positive difference.

### Zoom controls

| Control | Action |
| --- | --- |
| `−` / `+` | Zoom out / in by 25% |
| `100%` | Reset viewer zoom to 100% |
| `Fit to view` | Return to the normal fitted layout |
| `Ctrl` / `⌘` + mouse wheel | Zoom under normal desktop pointer use |
| `+` / `=` | Zoom in |
| `-` | Zoom out |
| `0` | Reset to 100% |

Viewer zoom ranges from 50% to 400%. Zoom changes only the presentation size; it does not change the calculated comparison result.

### Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `←` / `→` | Previous / next comparison page |
| `+` / `=` | Zoom in |
| `-` | Zoom out |
| `0` | Reset zoom to 100% |

## How comparison works

PDF Compare does not rely on page numbers alone.

1. Render a compact visual signature for every page
2. Extract text where the PDF contains a text layer
3. Calculate page similarity from appearance, text, and page proportions
4. Align the two page sequences with dynamic programming
5. Mark inserted and removed pages
6. Lazily render only the selected page at detailed resolution
7. Search for a small translation offset
8. Calculate pixel-level visual differences and change regions

Detailed page comparison is lazy rather than eagerly rendering every page at high resolution, which helps reduce memory use on larger documents.

## Publish with GitHub Pages

The repository includes a workflow that builds the fully embedded HTML and deploys it to GitHub Pages automatically.

1. Push the repository to GitHub as `htmlapps-pdf-compare`.
2. Open **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.
3. Push to `main`, or manually run the deployment workflow from the Actions tab.
4. After a successful deployment, the app is available at `https://ttomohisa.github.io/htmlapps-pdf-compare/`.

If Pages is not enabled yet, the workflow still builds the standalone artifacts and skips only the deployment step. Enable GitHub Actions as the Pages source, then re-run the workflow.

Each push to `main` rebuilds `dist/index.html` and `dist/index.self-extract.html` from pinned dependencies, verifies the generated artifacts, and publishes the result only after the standalone checks pass.

## Development and build layout

```text
.
├─ src/index.template.html            # Application template
├─ app.config.json                    # App metadata, version, and output settings
├─ dependencies.json                  # Pinned PDF.js version and embedded assets
├─ build-standalone.bat               # Windows build entry point
├─ build-standalone.ps1               # Single-HTML builder
├─ scripts/
│  ├─ check-repository.ps1            # Repository-wide build validation
│  ├─ verify-standalone.ps1           # Standard HTML verification
│  ├─ build-self-extract.ps1          # Gzip self-extracting HTML builder
│  └─ verify-self-extract.ps1         # Self-extract verification
├─ dist/
│  ├─ index.html                      # Generated standalone application
│  └─ index.self-extract.html         # Generated gzip self-extracting variant
└─ .github/workflows/
   ├─ build-standalone.yml            # Build validation
   └─ deploy-pages.yml                # Automatic Pages deployment from main
```

### Update dependencies

Edit the version and embedded asset configuration in `dependencies.json`, then build again.

To discard the package cache and download the dependency again:

```powershell
.\build-standalone.bat -ForceDownload
```

The build process automatically:

- Downloads the pinned `pdfjs-dist` tarball from the official npm registry
- Embeds the PDF.js module and worker into the HTML
- Embeds `cmaps`, `standard_fonts`, `wasm`, `iccs`, and `image_decoders`
- Records SHA-256 hashes for the dependency package and embedded assets
- Rejects external runtime script, stylesheet, frame, CSS URL, or module references
- Verifies `connect-src 'none'`
- Generates `dist/dependency-manifest.json`
- Generates a gzip self-extracting HTML variant
- Verifies that the self-extracting payload restores the source HTML byte-for-byte
- Verifies an ASCII-only self-extract loader and inherited embedded favicon

## Privacy and runtime network protection

The generated HTML includes:

- A Content Security Policy containing `connect-src 'none'`
- External `fetch` blocking in the main thread
- External `fetch` blocking inside the PDF.js worker
- A virtual asset loader that serves CMaps, fonts, WASM, and related data only from content embedded in the HTML
- Blob-based loading for the embedded PDF.js module and worker

The GitHub Pages version requires an initial HTML request, but the PDFs selected by the user and the comparison results are not transmitted by the app.

For use with the network completely disconnected, open the generated `dist/index.html` locally.

`pdf-compare.invalid` is an internal virtual asset key used by the embedded PDF.js asset loader. It is never contacted as a network host.

## Limitations

- OCR is not included. Scanned PDFs can be compared visually, but image-only text is not available to the text-diff feature.
- This is not a forensic checker for internal PDF objects such as digital signatures, forms, annotations, or object structure.
- Two PDFs with the same rendered appearance but different internal structure will generally be treated as visually identical.
- PDFs containing unusual image formats or font configurations may render differently from another PDF viewer.
- Large, image-heavy documents and High-quality rendering can consume substantial device memory.
- Text diff works only when PDF.js can extract text from the document.

## Dependencies

| Library | Version | License | Purpose |
| --- | ---: | --- | --- |
| PDF.js (`pdfjs-dist`) | 6.2.108 | Apache-2.0 | PDF loading, text extraction, rendering, CMaps, fonts, and related support assets |

Page matching, alignment correction, pixel diffing, change-region detection, text diff presentation, and viewer zoom are implemented by the app. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for dependency details.

## Contributing

Bug reports and feature proposals are welcome through GitHub Issues. See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidance.

## License

Copyright © 2026 ttomohisa

Licensed under the [MIT License](LICENSE).
