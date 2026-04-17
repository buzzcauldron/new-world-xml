@echo off
REM nwxml (New World XML) — Electron launcher (Windows). @version 1.0.0
setlocal
set "SCRIPT_DIR=%~dp0"
for %%F in ("%SCRIPT_DIR%..") do set "APP_DIR=%%~fF"
set "ELECTRON=%APP_DIR%\node_modules\.bin\electron.cmd"
if not exist "%ELECTRON%" (
  echo error: Electron not found — run npm ci
  exit /b 1
)
cd /d "%APP_DIR%"
"%ELECTRON%" "%APP_DIR%" %*
