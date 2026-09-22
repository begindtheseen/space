// Application menu. Full macOS layout; the same items minus the app menu elsewhere.
import { app, BrowserWindow, Menu } from 'electron'

/**
 * Lands the renderer on a route the same way "Check for Updates…" lands on Settings:
 * the preload's `onNavigate` listens on this channel (ipc.js, `NAVIGATE_CHANNEL`).
 * With no window open there is nothing to land on, and the click is a no-op.
 */
function navigate(path) {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed() && !win.webContents.isDestroyed()) win.webContents.send('orbit:navigate', path)
  }
}

/**
 * @param {{
 *   repo: string,
 *   versions: { shell: string, bundle: string, builtIn: string, electron: string },
 *   onCheckForUpdates: () => void,
 *   openExternal: (url: string) => void,
 * }} opts
 */
export function buildMenu({ repo, versions, onCheckForUpdates, openExternal }) {
  const isMac = process.platform === 'darwin'
  const repoUrl = `https://github.com/${repo}`

  app.setAboutPanelOptions({
    applicationName: 'ORBIT',
    applicationVersion: versions.shell,
    version: `bundle ${versions.bundle} · Electron ${versions.electron}`,
    copyright: 'GNC Flight Academy',
    website: repoUrl,
  })

  const checkItem = { label: 'Check for Updates…', click: () => onCheckForUpdates() }

  /** @type {Electron.MenuItemConstructorOptions[]} */
  const template = [
    ...(isMac
      ? [
          {
            role: 'appMenu',
            submenu: [
              { role: 'about', label: 'About ORBIT' },
              { type: 'separator' },
              checkItem,
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide', label: 'Hide ORBIT' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit', label: 'Quit ORBIT' },
            ],
          },
        ]
      : []),
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        ...(app.isPackaged ? [] : [{ role: 'toggleDevTools' }]),
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    { role: 'windowMenu' },
    {
      role: 'help',
      submenu: [
        { label: 'How to use ORBIT', click: () => navigate('/guide') },
        { type: 'separator' },
        ...(isMac ? [] : [checkItem, { type: 'separator' }]),
        { label: 'ORBIT on GitHub', click: () => openExternal(repoUrl) },
        { label: 'Releases', click: () => openExternal(`${repoUrl}/releases`) },
      ],
    },
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}
