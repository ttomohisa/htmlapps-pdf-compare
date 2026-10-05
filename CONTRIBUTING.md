# Contributing

Keep changes local-first, dependency-pinned, bilingual, responsive, and compatible with the repository build checks.

Before opening a pull request, run:

```powershell
.\scripts\check-repository.ps1
```

Node.js 22+ is required for the regression suite. The check builds both standalone variants, checks the tracked root artifact for drift, and runs lifecycle behavior tests against the template, tracked HTML, and generated HTML. The self-extract payload must restore the generated HTML exactly.

After an intentional template change, refresh the tracked standalone before the full check:

```powershell
.\build-standalone.ps1
Copy-Item .\dist\index.html .\pdf-compare.html
.\scripts\check-repository.ps1
```

The Node tests use bounded synthetic DOM/canvas/PDF.js boundaries and the actual application script. They do not measure browser heap use; use synthetic PDFs in a real browser for final PDF.js/worker and UI checks.
