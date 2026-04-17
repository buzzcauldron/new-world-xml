/**
 * Electron main process — replaces NW.js for desktop builds.
 */
'use strict';

const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

require('@electron/remote/main').initialize();

const pkgPath = path.join(__dirname, '..', 'package.json');
const manifest = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

// Linux: this app does not need hardware video decode; skipping it avoids noisy
// stderr ("vaInitialize failed") when libva/VAAPI is missing or misconfigured.
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('disable-accelerated-video-decode');
}

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
    if (base === 'visual-page-editor' || base === 'new-world-xml' || base === 'nwxml') continue;
    try {
      if (fs.existsSync(a)) {
        out.push(path.resolve(a));
      } else if (!path.isAbsolute(a)) {
        const fromCwd = path.resolve(process.cwd(), a);
        out.push(fs.existsSync(fromCwd) ? fromCwd : a);
      } else {
        out.push(a);
      }
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

function focusedWindowOrFirst() {
  return BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
}

function sendMenuIpc(channel) {
  const w = focusedWindowOrFirst();
  if (w && !w.isDestroyed()) {
    console.log('[vpe-main] menu: →', channel);
    w.webContents.send(channel);
  }
}

/** Application menu: file actions match keyboard shortcuts / renderer IPC (drawer proxies same IDs). */
function buildApplicationMenu() {
  const fileSubmenu = [
    {
      label: 'Open…',
      accelerator: 'CmdOrCtrl+O',
      click: () => sendMenuIpc('vpe-menu-open-file'),
    },
    {
      label: 'Save',
      accelerator: 'CmdOrCtrl+S',
      click: () => sendMenuIpc('vpe-menu-save'),
    },
    {
      label: 'Save As…',
      accelerator: 'CmdOrCtrl+Shift+S',
      click: () => sendMenuIpc('vpe-menu-save-as'),
    },
    {
      label: 'Print…',
      accelerator: 'CmdOrCtrl+P',
      click: () => sendMenuIpc('vpe-menu-print'),
    },
  ];
  if (process.platform !== 'darwin') {
    fileSubmenu.push({ type: 'separator' }, { role: 'quit' });
  }
  const template = [
    {
      label: 'File',
      submenu: fileSubmenu,
    },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' },
  ];
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    });
  }
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
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
      win.webContents.send('vpe-second-instance', extra);
    }
  });
}

ipcMain.on('vpe-get-launch-argv', (event) => {
  event.returnValue = mergeLaunchArgv();
});

/**
 * Sync IPC for nw-shim: BrowserWindow id for this webContents when remote.getCurrentWindow()
 * is unreliable (early load on some Linux/Wayland setups).
 */
ipcMain.on('vpe-nw-shim-window-id', (event) => {
  const w = BrowserWindow.fromWebContents(event.sender);
  event.returnValue = w && !w.isDestroyed() ? w.id : 0;
});

/** Native open dialog — returns real absolute paths (avoids input-file fakepath / missing File.path). */
ipcMain.handle('vpe-show-open-dialog', async (event, options) => {
  console.log('[vpe-main] vpe-show-open-dialog: invoke', options && options.defaultPath ? { defaultPath: options.defaultPath } : {});
  let win = BrowserWindow.fromWebContents(event.sender);
  if (!win || win.isDestroyed()) {
    win = BrowserWindow.getAllWindows()[0];
  }
  const opts = {
    properties: ['openFile', 'multiSelections'],
  };
  // Caller may pass filters; otherwise omit filters so the dialog shows all files (Electron rejects '*' as an extension on Linux).
  if (options && options.filters && options.filters.length) {
    opts.filters = options.filters;
  }
  let defaultPath = options && options.defaultPath;
  if (defaultPath) {
    try {
      if (fs.existsSync(defaultPath)) {
        const st = fs.statSync(defaultPath);
        defaultPath = st.isFile() ? path.dirname(defaultPath) : defaultPath;
      }
      opts.defaultPath = defaultPath;
    } catch {
      /* ignore invalid defaultPath */
    }
  }
  try {
    const result = await dialog.showOpenDialog(win || undefined, opts);
    const n = result.filePaths ? result.filePaths.length : 0;
    console.log('[vpe-main] vpe-show-open-dialog:', result.canceled ? 'canceled' : `${n} path(s)`);
    return { canceled: result.canceled, filePaths: result.filePaths || [] };
  } catch (err) {
    console.error('[vpe-main] vpe-show-open-dialog: error', err);
    throw err;
  }
});

/** Native save dialog — real path string. */
ipcMain.handle('vpe-show-save-dialog', async (event, options) => {
  let win = BrowserWindow.fromWebContents(event.sender);
  if (!win || win.isDestroyed()) {
    win = BrowserWindow.getAllWindows()[0];
  }
  const opts = {
    filters: (options && options.filters) || [{ name: 'Page XML', extensions: ['xml'] }],
  };
  if (options && options.defaultPath) {
    opts.defaultPath = options.defaultPath;
  }
  const result = await dialog.showSaveDialog(win || undefined, opts);
  return { canceled: result.canceled, filePath: result.filePath || '' };
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
    win.webContents.send('vpe-open-file', darwinOpenFiles.slice());
  }
});

app.on('browser-window-created', (_e, win) => {
  require('@electron/remote/main').enable(win.webContents);
});

app.whenReady().then(() => {
  buildApplicationMenu();
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
