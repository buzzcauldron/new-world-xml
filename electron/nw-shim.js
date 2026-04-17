/**
 * NW.js compatibility layer for Electron + @electron/remote.
 * Loaded from html/index.html before js/bundle.js so nw-app.js / nw-winstate.js work unchanged.
 */
'use strict';

/* global globalThis */

var ipcRenderer = require('electron').ipcRenderer;
var screen = require('electron').screen;
var remote = require('@electron/remote');
var BrowserWindow = remote.BrowserWindow;

/**
 * Resolve this renderer's BrowserWindow. Order:
 * 1) remote.getCurrentWindow() (correct for this webContents)
 * 2) main-process BrowserWindow.fromWebContents(sender) via sync IPC + fromId
 * 3) legacy fallbacks (often empty on early Linux/Wayland load — was breaking all UI)
 */
function getBrowserWindow() {
  try {
    var cur = remote.getCurrentWindow();
    if (cur) return cur;
  } catch (e) {
    console.warn('nw-shim: getCurrentWindow failed', e);
  }
  var wid = 0;
  try {
    wid = ipcRenderer.sendSync('vpe-nw-shim-window-id');
  } catch (e2) {
    console.warn('nw-shim: vpe-nw-shim-window-id failed', e2);
  }
  if (typeof wid === 'number' && wid > 0) {
    try {
      return BrowserWindow.fromId(wid);
    } catch (e3) {
      console.warn('nw-shim: BrowserWindow.fromId failed', e3);
    }
  }
  return BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
}

/**
 * NW.Window-like API backed by Electron BrowserWindow (for nw-app.js).
 */
function makeNwWindowAdapter(bw) {
  var adapter = {};
  function bounds() {
    return bw.getBounds();
  }
  Object.defineProperty(adapter, 'x', {
    get: function () {
      return bounds().x;
    },
    set: function (v) {
      var b = bounds();
      bw.setBounds({ x: v, y: b.y, width: b.width, height: b.height });
    },
  });
  Object.defineProperty(adapter, 'y', {
    get: function () {
      return bounds().y;
    },
    set: function (v) {
      var b = bounds();
      bw.setBounds({ x: b.x, y: v, width: b.width, height: b.height });
    },
  });
  Object.defineProperty(adapter, 'width', {
    get: function () {
      return bounds().width;
    },
    set: function (v) {
      var b = bounds();
      bw.setBounds({ x: b.x, y: b.y, width: v, height: b.height });
    },
  });
  Object.defineProperty(adapter, 'height', {
    get: function () {
      return bounds().height;
    },
    set: function (v) {
      var b = bounds();
      bw.setBounds({ x: b.x, y: b.y, width: b.width, height: v });
    },
  });

  adapter.resizeTo = function (w, h) {
    bw.setSize(w, h);
  };
  adapter.moveTo = function (x, y) {
    var b = bounds();
    bw.setBounds({ x: x, y: y, width: b.width, height: b.height });
  };
  adapter.maximize = function () {
    bw.maximize();
  };
  adapter.show = function () {
    bw.show();
  };
  adapter.showDevTools = function () {
    bw.webContents.openDevTools();
  };
  adapter.print = function (opts) {
    bw.webContents.print(opts || {});
  };
  adapter.reloadIgnoringCache = function () {
    bw.webContents.reloadIgnoringCache();
  };
  adapter.close = function (_force) {
    bw.close();
  };
  adapter.on = function (ev, fn) {
    if (ev === 'close') {
      bw.on('close', function (event) {
        fn.call(adapter, event);
      });
    } else {
      bw.on(ev, fn);
    }
  };
  adapter.window = typeof window !== 'undefined' ? window : globalThis;
  return adapter;
}

var openListeners = [];

var manifest = ipcRenderer.sendSync('vpe-get-manifest');
var launchArgv = ipcRenderer.sendSync('vpe-get-launch-argv');

function buildScreens() {
  return screen.getAllDisplays().map(function (d) {
    return {
      bounds: d.bounds,
      work_area: d.workArea,
    };
  });
}

globalThis.nw = {
  Window: {
    get: function () {
      var bw = getBrowserWindow();
      if (!bw) {
        throw new Error('nw-shim: no BrowserWindow');
      }
      return makeNwWindowAdapter(bw);
    },
    open: function (url, opts) {
      ipcRenderer.send('vpe-open-window', { url: url, opts: opts || {} });
    },
  },
  App: {
    manifest: manifest,
    argv: launchArgv,
    on: function (event, fn) {
      if (event === 'open') {
        openListeners.push(fn);
      }
    },
  },
  Screen: {
    Init: function () {},
    get screens() {
      return buildScreens();
    },
  },
};

ipcRenderer.on('vpe-second-instance', function (_e, paths) {
  openListeners.forEach(function (fn) {
    fn(paths);
  });
});

ipcRenderer.on('vpe-open-file', function (_e, paths) {
  openListeners.forEach(function (fn) {
    fn(paths);
  });
});
