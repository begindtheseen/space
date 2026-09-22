// Main window: hardened BrowserWindow with bounds persistence.
import fs from 'node:fs'
import path from 'node:path'
import { app, BrowserWindow, screen, session } from 'electron'

const DEFAULT_BOUNDS = { width: 1280, height: 820 }
const MIN_WIDTH = 900
const MIN_HEIGHT = 600
const SAVE_DEBOUNCE_MS = 400
// Enough of the window must land on a display for the title bar to be grabbable.
const MIN_VISIBLE_W = 100
const MIN_VISIBLE_H = 60

/** Process-wide guards; call once after ready. */
export function installGlobalGuards() {
  app.on('web-contents-created', (_event, contents) => {
    contents.on('will-attach-webview', (event) => event.preventDefault())
  })
  session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false))
}

function isHttps(url) {
  try {
    return new URL(url).protocol === 'https:'
  } catch {
    return false
  }
}

function readBounds(file, log) {
  let data
  try {
    data = JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (err) {
    if (err.code !== 'ENOENT') log('window: ignoring unreadable window.json:', err.message)
    return null
  }
  const nums = ['x', 'y', 'width', 'height'].map((k) => data?.[k])
  if (!nums.every((n) => Number.isFinite(n))) return null
  const [x, y] = nums
  const width = Math.max(MIN_WIDTH, Math.round(nums[2]))
  const height = Math.max(MIN_HEIGHT, Math.round(nums[3]))
  const rect = { x: Math.round(x), y: Math.round(y), width, height }
  const visible = screen.getAllDisplays().some(({ workArea: d }) => {
    const w = Math.min(rect.x + rect.width, d.x + d.width) - Math.max(rect.x, d.x)
    const h = Math.min(rect.y + rect.height, d.y + d.height) - Math.max(rect.y, d.y)
    return w >= MIN_VISIBLE_W && h >= MIN_VISIBLE_H
  })
  return visible ? rect : null
}

function writeBounds(file, rect, log) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    const tmp = `${file}.${process.pid}.tmp`
    fs.writeFileSync(tmp, JSON.stringify(rect) + '\n')
    fs.renameSync(tmp, file)
  } catch (err) {
    log('window: could not save bounds:', err.message)
  }
}

/**
 * @param {{
 *   preload: string,
 *   boundsFile: string,
 *   allowedOrigins: string[],           // origins the window may navigate within
 *   openExternal: (url: string) => void,
 *   log?: (...a: unknown[]) => void,
 * }} opts
 */
export function createMainWindow({ preload, boundsFile, allowedOrigins, openExternal, log = () => {} }) {
  const saved = readBounds(boundsFile, log)
  const win = new BrowserWindow({
    ...(saved ?? { ...DEFAULT_BOUNDS, center: true }),
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    title: 'ORBIT',
    show: false,
    backgroundColor: '#000208',
    webPreferences: {
      preload,
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
      spellcheck: false,
    },
  })

  const isAllowed = (url) => allowedOrigins.some((origin) => url === origin || url.startsWith(`${origin}/`))
  const wc = win.webContents

  wc.setWindowOpenHandler(({ url }) => {
    if (isHttps(url)) openExternal(url)
    return { action: 'deny' }
  })
  wc.on('will-navigate', (event, url) => {
    if (isAllowed(url)) return
    event.preventDefault()
    if (isHttps(url)) openExternal(url)
  })
  // The shell owns the window title; the page's <title> is for the browser build.
  win.on('page-title-updated', (event) => event.preventDefault())

  let saveTimer = null
  const persist = () => {
    saveTimer = null
    if (win.isDestroyed() || win.isMinimized() || win.isMaximized() || win.isFullScreen()) return
    writeBounds(boundsFile, win.getNormalBounds(), log)
  }
  const schedulePersist = () => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(persist, SAVE_DEBOUNCE_MS)
  }
  win.on('resize', schedulePersist)
  win.on('move', schedulePersist)
  win.on('close', () => {
    if (saveTimer) clearTimeout(saveTimer)
    persist()
  })

  return win
}
