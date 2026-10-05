## 1.0.0

- Fixed the build placeholder verifier to avoid false positives from internal PDF.js worker identifiers.

# Changelog

## Unreleased

- Own and cancel each comparison's document loads and renders on replacement, reset, or failure while retaining the shared PDF engine worker.
- Prevent older page renders, errors, and PNG callbacks from overwriting or exporting newer comparison settings.
- Queue password prompts for two encrypted PDFs and dismiss pending prompts when cancelled.
- Fix Previous/Next, arrow-key, and Changed-only navigation.
- Add lifecycle regressions and tracked/generated standalone parity checks.

- Reduced standalone HTML size by gzip-compressing the embedded PDF.js asset bundle before Base64 embedding.
- Removed unused PDF.js `image_decoders` and QuickJS evaluator assets from the standalone bundle.
- Added build verification for the compressed asset bundle format.

## 1.0.0 - Windows PowerShell build compatibility

- Removed the dependency on the `Get-FileHash` cmdlet and calculate SHA-256 through .NET instead.
- Replaced `::new()` constructor syntax in self-extract verification paths with `New-Object` for broader Windows PowerShell compatibility.
- Kept the application version at 1.0.0.

## 1.0.0 - 2026-08-17

- Initial PDF Compare release.
- Added local-only automatic page matching, visual/text differences, and five comparison modes.
- Embedded PDF.js CMaps, standard fonts, WASM, ICC profiles, and image decoders for Japanese/CID-font PDFs.
- Added direct `file://` support with an embedded worker/fake-worker path.
- Added 50–400% comparison zoom with Fit to view, keyboard shortcuts, and Ctrl/Cmd + wheel zoom.
- Kept all PDF processing on-device with runtime network access blocked by CSP.
