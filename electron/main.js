/**
 * Electron main process — replaces NW.js for desktop builds.
 */
'use strict';

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

require('@electron/remote/main').initialize();

const pkgPath = path.join(__dirname, '..', 'package.json');
const manifest = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

/** Extra paths from macOS open-file / file association (merged into launch argv). */
const darwinOpenFiles = [];

/** @type {BrowserWindow | null} */
let mainWindow = null;

/**
 * NW-style argv entries: files and non-flag tokens (not the Electron binary).
 * @param {string[]} argv
 */
function filterNwArgv(argv) {
  const out = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a || a === '.') continue;
    if (a.startsWith('-')) continue;
    const base = path.basename(a);
    if (/^electron(\.exe)?$/i.test(base)) continue;
    if (base === 'visual-page-editor') continue;
    try {
      out.push(fs.existsSync(a) ? path.resolve(a) : a);
    } catch {
      out.push(a);
    }
  }
  return out;
}

function mergeLaunchArgv() {
  const fromArgv = filterNwArgv(process.argv.slice(process.defaultApp ? 2 : 1));
  const seen = new Set();
  const merged = [];
  for (const p of [...fromArgv, ...darwinOpenFiles]) {
    if (!seen.has(p)) {
      seen.add(p);
      merged.push(p);
    }
  }
  return merged;
}

function indexHtmlUrl(hash) {
  const indexPath = path.join(__dirname, '..', 'html', 'index.html');
  const u = pathToFileURL(indexPath).href;
  return hash ? `${u}#${hash.replace(/^#/, '')}` : u;
}

function createWindow(hash) {
  const wcfg = manifest.window || {};
  const win = new BrowserWindow({
    width: wcfg.width || 1200,
    height: wcfg.height || 800,
    minWidth: wcfg.min_width || 800,
    minHeight: wcfg.min_height || 600,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false,
    },
  });

  require('@electron/remote/main').enable(win.webContents);

  win.loadURL(indexHtmlUrl(hash || ''));

  win.once('ready-to-show', () => {
    win.show();
  });

  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null;
  });

  return win;
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, commandLine) => {
    const extra = filterNwArgv(commandLine.slice(process.defaultApp ? 2 : 1));
    const win = BrowserWindow.getAllWindows()[0];
    if (win && !win.isDestroyed()) {
      win.focus();
      win.webContents.send('vpe-second-instance', extra.join(' '));
    }
  });
}

ipcMain.on('vpe-get-launch-argv', (event) => {
  event.returnValue = mergeLaunchArgv();
});

ipcMain.on('vpe-get-manifest', (event) => {
  event.returnValue = manifest;
});

ipcMain.on('vpe-open-window', (_event, payload) => {
  const url = (payload && payload.url) || '';
  const hashMatch = url.match(/#([^#]*)$/);
  const hash = hashMatch ? hashMatch[1] : '1';
  createWindow(hash);
});

app.on('open-file', (event, filePath) => {
  event.preventDefault();
  darwinOpenFiles.push(path.resolve(filePath));
  const win = BrowserWindow.getAllWindows()[0];
  if (win && !win.isDestroyed()) {
    win.webContents.send('vpe-open-file', darwinOpenFiles.join(' '));
  }
});

app.on('browser-window-created', (_e, win) => {
  require('@electron/remote/main').enable(win.webContents);
});

app.whenReady().then(() => {
  mainWindow = createWindow('');
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createWindow('');
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
