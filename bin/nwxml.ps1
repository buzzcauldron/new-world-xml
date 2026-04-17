# nwxml (New World XML) — Electron launcher (Windows).
# @version 1.0.0
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Arguments
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$AppDir = Split-Path -Parent $ScriptDir

if (-not (Test-Path (Join-Path $AppDir "electron\main.js"))) {
    Write-Error "Cannot find electron\main.js — run from repo root after npm install."
}

# Optional portable Node from .tools (same as install-desktop.ps1)
$ToolsDir = Join-Path $AppDir ".tools"
if (Test-Path $ToolsDir) {
    foreach ($d in (Get-ChildItem -Path $ToolsDir -Directory -Filter "node-v*" -ErrorAction SilentlyContinue)) {
        $nodeExe = Join-Path $d.FullName "node.exe"
        $nodeExeBin = Join-Path $d.FullName "bin\node.exe"
        if (Test-Path -LiteralPath $nodeExe) {
            $env:PATH = $d.FullName + ";" + $env:PATH
            break
        }
        if (Test-Path -LiteralPath $nodeExeBin) {
            $env:PATH = (Join-Path $d.FullName "bin") + ";" + $env:PATH
            break
        }
    }
}

$ElectronCmd = Join-Path $AppDir "node_modules\.bin\electron.cmd"
if (-not (Test-Path $ElectronCmd)) {
    Write-Error "Electron not found at node_modules\.bin\electron.cmd — run: npm ci"
}

Set-Location $AppDir
& $ElectronCmd $AppDir @Arguments
