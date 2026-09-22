// Frameless splash shown while the main window boots. Talks to its page only via
// `webContents.executeJavaScript` against the `window.orbitSplash` helpers.
import { BrowserWindow } from 'electron'
import { splashHtml } from './paths.js'

const SHOW_FALLBACK_MS = 2000
const OUT_MS = 350

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * @param {{ shell: string, bundle: string, minimumMs: number, credit?: string, log?: (...a: unknown[]) => void }} opts
 */
export function createSplash({ shell, bundle, minimumMs, credit = '', log = () => {} }) {
  const win = new BrowserWindow({
    width: 760,
    height: 460,
    frame: false,
    resizable: false,
    fullscreenable: false,
    show: false,
    center: true,
    backgroundColor: '#000208',
    hasShadow: true,
    roundedCorners: true,
    webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false },
  })
  win.setMenuBarVisibility(false)

  let shownAt = null
  let gone = false
  win.once('closed', () => {
    gone = true
  })

  const shown = new Promise((resolve) => {
    let done = false
    const show = () => {
      if (done) return
      done = true
      if (!gone && !win.isDestroyed()) {
        win.show()
        shownAt = Date.now()
      }
      resolve()
    }
    win.once('ready-to-show', show)
    win.once('closed', show)
    // If the page never reaches ready-to-show (e.g. font decoding stalls) the
    // splash is still shown so the boot is never invisible.
    setTimeout(show, SHOW_FALLBACK_MS)
  })

  const query = { shell, bundle }
  if (credit) query.credit = credit
  win.loadFile(splashHtml, { query }).catch((err) => log('splash: load failed:', err.message))

  async function run(js) {
    if (gone || win.isDestroyed()) return
    try {
      await win.webContents.executeJavaScript(js, true)
    } catch (err) {
      log('splash: script failed:', err.message)
    }
  }
  const call = (method, text) =>
    run(`window.orbitSplash && window.orbitSplash.${method}(${JSON.stringify(String(text ?? ''))})`)

  function close() {
    if (gone || win.isDestroyed()) return
    gone = true
    win.close()
  }

  return {
    status: (text) => call('status', text),
    error: (text) => call('error', text),
    /** Resolves once the splash has been visible for `minimumMs` (or was closed). */
    async waitMinimum() {
      await shown
      if (shownAt === null) return
      const remaining = minimumMs - (Date.now() - shownAt)
      if (remaining > 0) await sleep(remaining)
    },
    /** Fade out, then close. */
    async dismiss() {
      if (gone || win.isDestroyed()) return
      await run('window.orbitSplash && window.orbitSplash.out()')
      await sleep(OUT_MS)
      close()
    },
    close,
  }
}
