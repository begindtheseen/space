'use strict'
// Sandboxed preload: the only bridge between the web bundle and the shell.
// Exposed as `window.orbit`; see the OrbitBridge interface in src/lib/desktop.ts.
const { contextBridge, ipcRenderer } = require('electron')

function readVersions() {
  try {
    const v = ipcRenderer.sendSync('orbit:versions')
    if (v && typeof v === 'object') {
      return {
        shell: String(v.shell ?? ''),
        bundle: String(v.bundle ?? ''),
        builtIn: String(v.builtIn ?? ''),
        electron: String(v.electron ?? process.versions.electron ?? ''),
      }
    }
  } catch {
    // fall through to the empty shape below
  }
  return { shell: '', bundle: '', builtIn: '', electron: String(process.versions.electron ?? '') }
}

function subscribe(channel, cb) {
  if (typeof cb !== 'function') throw new TypeError('callback must be a function')
  const listener = (_event, payload) => cb(payload)
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

const bridge = {
  platform: process.platform,
  versions: Object.freeze(readVersions()),
  ready() {
    ipcRenderer.send('orbit:ready')
  },
  /** Reports a boot step so the splash can show what is being done. */
  bootStatus(text) {
    ipcRenderer.send('orbit:boot-status', String(text))
  },
  updates: {
    getState: () => ipcRenderer.invoke('orbit:updates:get-state'),
    check: () => ipcRenderer.invoke('orbit:updates:check'),
    download: () => ipcRenderer.invoke('orbit:updates:download'),
    apply: () => ipcRenderer.invoke('orbit:updates:apply'),
    rollback: () => ipcRenderer.invoke('orbit:updates:rollback'),
    downloadApp: () => ipcRenderer.invoke('orbit:updates:download-app'),
    installApp: () => ipcRenderer.invoke('orbit:updates:install-app'),
    setToken: (token) => ipcRenderer.invoke('orbit:updates:set-token', token === null ? null : String(token)),
    onState: (cb) => subscribe('orbit:updates:state', cb),
  },
  backup: {
    write: (json) => ipcRenderer.invoke('orbit:backup:write', String(json)),
    read: () => ipcRenderer.invoke('orbit:backup:read'),
  },
  run: {
    detect: (refresh) => ipcRenderer.invoke('orbit:run:detect', refresh === true),
    exec: (request) => ipcRenderer.invoke('orbit:run:exec', request),
  },
  openExternal: (url) => ipcRenderer.invoke('orbit:open-external', String(url)),
  onNavigate: (cb) => subscribe('orbit:navigate', cb),
}

contextBridge.exposeInMainWorld('orbit', bridge)
