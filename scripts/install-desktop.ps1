# One-shot desktop setup: Node (if needed) + npm install + verify Electron.
# Usage: .\scripts\install-desktop.ps1 [-Start]
param([switch]$Start)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $Root

Write-Host "==> Installing dependencies (Electron desktop)..."
& (Join-Path $Root "scripts\bootstrap-node.ps1")

$ElectronCmd = Join-Path $Root "node_modules\.bin\electron.cmd"
$ElectronCli = Join-Path $Root "node_modules\electron\cli.js"
if (-not (Test-Path $ElectronCmd) -and -not (Test-Path $ElectronCli)) {
    Write-Error "Electron package missing. Try: Remove-Item -Recurse -Force node_modules; .\scripts\install-desktop.ps1"
}
Write-Host "==> Electron OK."

if ($Start) {
    Write-Host "==> Starting app..."
    npm start
}
else {
    Write-Host ""
    Write-Host "Install complete. Run: npm start   or   .\bin\nwxml.ps1"
}
