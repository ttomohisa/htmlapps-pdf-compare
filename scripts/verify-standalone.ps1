param(
  [Parameter(Mandatory = $true)]
  [string]$Path,
  [bool]$RequireNetworkBlock = $true
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

if (-not (Test-Path $Path)) { throw "HTML file not found: $Path" }
$html = Get-Content -Raw -Encoding UTF8 $Path

$knownBuildPlaceholders = @(
  "__APP_CONFIG_JSON__",
  "__BUILD_MANIFEST_JSON__",
  "__EMBEDDED_ASSET_BUNDLE_GZIP_BASE64__"
)
$remainingBuildPlaceholders = @($knownBuildPlaceholders | Where-Object { $html.Contains($_) })
$placeholderMessage = if ($remainingBuildPlaceholders.Count -gt 0) {
  "A build placeholder remains: " + ($remainingBuildPlaceholders -join ", ")
} else {
  "A build placeholder remains"
}

$checks = @(
  @{ Message = "HTML document marker is missing"; Failed = -not $html.TrimStart().StartsWith("<!doctype html>", [StringComparison]::OrdinalIgnoreCase) },
  @{ Message = "Viewport metadata is missing"; Failed = $html -notmatch '<meta\s+name=["'']viewport["'']' },
  @{ Message = $placeholderMessage; Failed = $remainingBuildPlaceholders.Count -gt 0 },
  @{ Message = "An external script URL remains"; Failed = $html -match '<script[^>]+src\s*=\s*["'']https?://' },
  @{ Message = "An external stylesheet URL remains"; Failed = $html -match '<link[^>]+href\s*=\s*["'']https?://' },
  @{ Message = "An external frame URL remains"; Failed = $html -match '<(?:iframe|frame)[^>]+src\s*=\s*["'']https?://' },
  @{ Message = "An external CSS url() remains"; Failed = $html -match 'url\(\s*["'']?https?://' },
  @{ Message = "An external module import remains"; Failed = $html -match '(?:import\s+.+?from\s*|import\s*\()\s*["'']https?://' },
  @{ Message = "Embedded asset bundle is not gzip-compressed"; Failed = $html -notmatch 'id=["'']embedded-assets["''][^>]*data-compression=["'']gzip["'']' },
  @{ Message = "Embedded asset bundle decompressor is missing"; Failed = $html -notmatch 'DecompressionStream' }
)

if ($RequireNetworkBlock -and $html -notmatch "connect-src\s+'none'") {
  throw "connect-src 'none' is missing from Content Security Policy"
}

foreach ($check in $checks) {
  if ($check.Failed) { throw $check.Message }
}

Write-Host "[OK] Standalone verification passed: $Path" -ForegroundColor Green
