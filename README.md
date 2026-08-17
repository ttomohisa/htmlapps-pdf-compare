# PDF Compare

A privacy-friendly single-HTML PDF comparison tool that finds changes between two documents entirely in the browser.

## Highlights

- No PDF upload or runtime network access
- Embedded PDF.js CMaps, standard fonts, WASM, ICC profiles, and image decoders for offline Japanese/CID-font rendering
- Automatic page matching using visual and extracted-text similarity
- Detects inserted and removed pages
- Automatic translation alignment to reduce scan/position noise
- Five views: Diff, Side by side, Overlay, Slider, Blink
- Pixel-level visual difference percentage and change regions
- Extracted text diff
- Password-protected PDFs
- 50–400% viewer zoom and Fit to view
- Diff PNG and CSV report export
- Japanese / English UI
- Mobile-first responsive layout
- Builds both `dist/index.html` and `dist/index.self-extract.html`

## Build

On Windows 10/11:

```powershell
.\build-standalone.bat
```

The first build downloads the pinned `pdfjs-dist` package from npm and embeds it into the HTML. Runtime networking is blocked by CSP.

## GitHub Pages

Set **Settings → Pages → Source** to **GitHub Actions**, then push to `main`. The workflow includes a Pages preflight check so an unconfigured repository still produces build artifacts without failing at `configure-pages`.

## Privacy

Selected PDFs stay in browser memory. The built HTML includes `connect-src 'none'`.

## License

MIT. PDF rendering uses Mozilla PDF.js (`pdfjs-dist`, Apache-2.0).
