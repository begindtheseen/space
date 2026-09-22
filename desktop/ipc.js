// Main-process side of the preload bridge. Every argument from the renderer is
// validated; every invoke handler resolves (with an error-shaped state) rather
// than rejecting, so a broken updater never surfaces as a raw IPC exception.
import { BrowserWindow, ipcMain, shell } from 'electron'
import { readBackup, writeBackup } from './backup.js'
import { detectToolchains, runCode } from './runner.js'
import { TOKEN_RE, TOKEN_RULE } from './config.js'

const STATE_CHANNEL = 'orbit:updates:state'
const NAVIGATE_CHANNEL = 'orbit:navigate'
const MAX_URL_LENGTH = 2048

/**
 * Opens https:/mailto: links in the system browser/mail client. Anything else is dropped.
 * @returns {boolean} whether the URL was accepted
 */
export function openExternal(url, log = () => {}) {
  if (typeof url !== 'string' || url.length > MAX_URL_LENGTH) return false
  let parsed
  try {
    parsed = new URL(url)
  } catch {
    return false
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'mailto:') return false
  shell.openExternal(parsed.href).catch((err) => log('openExternal failed:', err.message))
  return true
}

function errorMessage(err) {
  if (err instanceof Error && err.message) return err.message
  if (typeof err === 'string' && err) return err
  return 'Unexpected error.'
}

/**
 * @param {{
 *   updater: import('./updater.js').Updater,
 *   config: ReturnType<typeof import('./config.js').createConfig>,
 *   versions: { shell: string, bundle: string, builtIn: string, electron: string },
 *   repo: string,
 *   allowedOrigins: string[],
 *   log?: (...a: unknown[]) => void,
 * }} opts
 */
export function registerIpc({ updater, config, versions, repo, allowedOrigins, log = () => {} }) {
  const readyListeners = new Set()

  function isTrusted(event) {
    const frame = event.senderFrame
    if (!frame || event.sender.isDestroyed() || frame !== event.sender.mainFrame) return false
    const url = frame.url
    return allowedOrigins.some((origin) => url === origin || url.startsWith(`${origin}/`))
  }

  // The config file is the source of truth for the token; the updater only sees
  // it through getToken(), so its own hasToken can lag behind a setToken().
  function decorate(state) {
    const out = { ...state, hasToken: config.hasToken() }
    if (config.isPlaintext()) out.tokenPlaintext = true
    return out
  }

  function fallbackState(error) {
    return {
      status: 'error',
      current: versions.bundle,
      builtIn: versions.builtIn,
      shell: versions.shell,
      repo,
      error,
      hasToken: false,
      canRollback: false,
    }
  }

  function snapshot() {
    try {
      const state = updater.getState()
      if (state && typeof state === 'object') return decorate(state)
      return decorate(fallbackState('Updater returned no state.'))
    } catch (err) {
      log('updater.getState failed:', err)
      return decorate(fallbackState(errorMessage(err)))
    }
  }

  function errorState(err) {
    return { ...snapshot(), status: 'error', error: errorMessage(err) }
  }

  function broadcast(channel, payload) {
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed() && !win.webContents.isDestroyed()) win.webContents.send(channel, payload)
    }
  }

  updater.on('state', (state) => {
    if (state && typeof state === 'object') broadcast(STATE_CHANNEL, decorate(state))
  })

  /** Registers an invoke handler that always resolves with a state snapshot. */
  function handleState(channel, run) {
    ipcMain.handle(channel, async (event, ...args) => {
      if (!isTrusted(event)) return errorState('Request from an untrusted page was ignored.')
      try {
        return await run(...args)
      } catch (err) {
        log(`${channel} failed:`, err)
        return errorState(err)
      }
    })
  }

  ipcMain.on('orbit:versions', (event) => {
    event.returnValue = isTrusted(event) ? versions : null
  })

  ipcMain.on('orbit:ready', (event) => {
    if (!isTrusted(event)) return
    for (const listener of readyListeners) listener(event.sender)
  })

  handleState('orbit:updates:get-state', () => snapshot())
  handleState('orbit:updates:check', async () => decorate(await updater.check()))
  handleState('orbit:updates:download', async () => decorate(await updater.download()))
  handleState('orbit:updates:apply', async () => {
    await updater.apply()
  })
  handleState('orbit:updates:rollback', async () => {
    await updater.rollback()
  })
  handleState('orbit:updates:set-token', async (token) => {
    let next = null
    if (token !== null && token !== undefined) {
      if (typeof token !== 'string') return errorState(TOKEN_RULE)
      next = token.trim()
      if (next === '') next = null
      else if (!TOKEN_RE.test(next)) return errorState(TOKEN_RULE)
    }
    await config.setToken(next)
    return snapshot()
  })

  ipcMain.handle('orbit:open-external', (event, url) => {
    if (!isTrusted(event)) return
    if (!openExternal(url, log)) log('open-external: rejected', typeof url === 'string' ? url.slice(0, 120) : typeof url)
  })

  // The progress mirror. Both handlers swallow their own failures: the
  // renderer's IndexedDB copy is the working one, and a disk problem must
  // degrade the safety net rather than interrupt a study session.
  ipcMain.handle('orbit:backup:write', (event, json) => {
    if (!isTrusted(event)) return false
    return writeBackup(json, log)
  })

  ipcMain.handle('orbit:backup:read', (event) => {
    if (!isTrusted(event)) return null
    return readBackup(log)
  })

  // Running her code. Both handlers resolve rather than reject, so a missing
  // compiler reaches the page as something explainable instead of a raw IPC
  // exception the playground would have to guess at.
  ipcMain.handle('orbit:run:detect', async (event, refresh) => {
    if (!isTrusted(event)) return {}
    try {
      return await detectToolchains(refresh === true)
    } catch (err) {
      log('toolchain detect failed:', errorMessage(err))
      return {}
    }
  })

  ipcMain.handle('orbit:run:exec', async (event, request) => {
    if (!isTrusted(event)) return null
    try {
      return await runCode(request, log)
    } catch (err) {
      return {
        ok: false,
        stage: 'run',
        reason: errorMessage(err),
        stdout: '',
        stderr: '',
        exitCode: null,
        timedOut: false,
        truncated: false,
        ms: 0,
      }
    }
  })

  return {
    /** @param {(sender: Electron.WebContents) => void} listener */
    onReady(listener) {
      readyListeners.add(listener)
      return () => readyListeners.delete(listener)
    },
    navigate(path) {
      broadcast(NAVIGATE_CHANNEL, path)
    },
  }
}
