// ORBIT desktop shell entry point. Boot sequence:
//   register app:// scheme → sandbox → env overrides → single-instance lock → ready →
//   resolve active bundle → serve it → splash + hidden main window → show when the
//   renderer reports ready (watchdog quarantines a downloaded bundle that never does).
import fs from 'node:fs'
import path from 'node:path'
import { app, BrowserWindow, dialog } from 'electron'
import { Updater } from './updater.js'
import { createConfig } from './config.js'
import { openExternal, registerIpc } from './ipc.js'
import { buildMenu } from './menu.js'
import * as paths from './paths.js'
import { APP_ORIGIN, APP_URL, installAppProtocol, registerAppScheme } from './protocol.js'
import { createSplash } from './splash.js'
import { createMainWindow, installGlobalGuards } from './window.js'

const DEFAULT_REPO = 'begindtheseen/space'
const REPO_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/

const env = Object.freeze({
  e2e: process.env.ORBIT_E2E === '1',
  userData: process.env.ORBIT_USER_DATA ? path.resolve(process.env.ORBIT_USER_DATA) : null,
  devUrl: process.env.ORBIT_DEV_URL || null,
  apiBase: process.env.ORBIT_UPDATE_API_BASE || 'https://api.github.com',
})

const timing = Object.freeze({
  splashMinimumMs: env.e2e ? 300 : 1400,
  watchdogMs: env.e2e ? 3000 : 15000,
  // Built-in bundles predating the ready() call are trusted after did-finish-load.
  finishLoadGraceMs: 300,
  autoCheckDelayMs: 4000,
})

const log = (...args) => console.log('[orbit]', ...args)
const logError = (...args) => console.error('[orbit]', ...args)

process.on('uncaughtException', (err) => logError('uncaught exception:', err))
process.on('unhandledRejection', (reason) => logError('unhandled rejection:', reason))

/** @type {BrowserWindow | null} */
let mainWindow = null
let quitting = false

// ── before ready ──────────────────────────────────────────────────────────────
registerAppScheme()
// An explicit --no-sandbox (root in CI/xvfb) must win: enableSandbox() would
// re-sandbox the utility processes and the network service dies at launch.
// Renderers stay sandboxed either way through each window's webPreferences.
if (!app.commandLine.hasSwitch('no-sandbox')) app.enableSandbox()
if (env.userData) {
  fs.mkdirSync(env.userData, { recursive: true })
  app.setPath('userData', env.userData)
}

// The lock is keyed on userData, so it must come after the override above.
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => focusMainWindow())
  app.on('before-quit', () => {
    quitting = true
  })
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
  app
    .whenReady()
    .then(main)
    .catch((err) => fatal('ORBIT could not start.', err))
}

// ── helpers ───────────────────────────────────────────────────────────────────
function fatal(message, err) {
  logError(message, err)
  try {
    dialog.showErrorBox('ORBIT', `${message}\n\n${err instanceof Error ? err.message : String(err)}`)
  } catch {
    // no display: the log line is all we can do
  }
  app.exit(1)
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (err) {
    if (err.code !== 'ENOENT') log(`could not read ${file}:`, err.message)
    return null
  }
}

function readRepo() {
  const repo = readJson(paths.packageJsonFile)?.orbit?.updates?.repo
  if (typeof repo === 'string' && REPO_RE.test(repo)) return repo
  log(`package.json orbit.updates.repo missing or invalid; using ${DEFAULT_REPO}`)
  return DEFAULT_REPO
}

function readBundleVersion(dir) {
  const version = readJson(path.join(dir, 'orbit-bundle.json'))?.version
  return typeof version === 'string' && version ? version : null
}

function readSplashCredit() {
  const credit = readJson(paths.splashSourceJson)?.credit
  return typeof credit === 'string' ? credit.slice(0, 200) : ''
}

function devOrigin() {
  if (!env.devUrl) return null
  try {
    return new URL(env.devUrl).origin
  } catch {
    log('ORBIT_DEV_URL is not a valid URL; ignoring:', env.devUrl)
    return null
  }
}

function relaunch() {
  quitting = true
  if (env.e2e) {
    app.quit()
    return
  }
  app.relaunch()
  app.exit(0)
}

function focusMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return
  if (mainWindow.isMinimized()) mainWindow.restore()
  if (!mainWindow.isVisible()) mainWindow.show()
  mainWindow.focus()
}

/**
 * Resolves the active bundle through the updater, falling back to the built-in
 * bundle if the updater cannot answer: a broken bundles/ directory must never
 * keep the app from starting.
 */
function resolveActive(updater, builtInDir, shellVersion) {
  const builtIn = { dir: builtInDir, version: readBundleVersion(builtInDir) ?? shellVersion, builtIn: true }
  try {
    const result = updater.resolveActive()
    const active = updater.active ?? result
    if (active && typeof active.dir === 'string' && typeof active.version === 'string') {
      return { dir: active.dir, version: active.version, builtIn: active.builtIn !== false }
    }
    log('updater.resolveActive returned no bundle; using built-in')
  } catch (err) {
    logError('updater.resolveActive failed; using built-in:', err)
  }
  return builtIn
}

// ── after ready ───────────────────────────────────────────────────────────────
async function main() {
  const shellVersion = app.getVersion()
  const repo = readRepo()
  const builtInDir = paths.builtInDir()
  const userData = app.getPath('userData')
  const config = createConfig(paths.configFile(), log)

  const updater = new Updater({
    repo,
    apiBase: env.apiBase,
    userData,
    builtInDir,
    shellVersion,
    // Node's fetch, not Electron's net.fetch: the updater follows redirects by
    // hand (redirect: 'manual') so it can drop the Authorization header before
    // the hop to GitHub's signed storage URL, which rejects it. net.fetch cannot
    // do that — in manual mode it throws "Redirect was cancelled", and in follow
    // mode it forwards the bearer token to the redirect target.
    fetchImpl: (input, init) => globalThis.fetch(input, init),
    getToken: () => config.getToken(),
    log,
  })
  // An 'error' event with no listener would throw out of the emitter and crash the process.
  updater.on('error', (err) => logError('updater error:', err))
  updater.on('relaunch', relaunch)

  const active = resolveActive(updater, builtInDir, shellVersion)
  installAppProtocol(active.dir, log)
  installGlobalGuards()

  const versions = Object.freeze({
    shell: shellVersion,
    bundle: active.version,
    builtIn: readBundleVersion(builtInDir) ?? shellVersion,
    electron: process.versions.electron,
  })
  log(`shell ${versions.shell} · bundle ${versions.bundle} (${active.builtIn ? 'built-in' : 'downloaded'}) · ${active.dir}`)

  const dev = devOrigin()
  const allowedOrigins = dev ? [APP_ORIGIN, dev] : [APP_ORIGIN]
  const startUrl = dev ? env.devUrl : APP_URL
  const open = (url) => openExternal(url, log)

  const ipc = registerIpc({ updater, config, versions, repo, allowedOrigins, log })

  const windowOptions = { preload: paths.preloadFile, boundsFile: paths.windowFile(), allowedOrigins, openExternal: open, log }

  const navigate = (route) => {
    if (!mainWindow || mainWindow.isDestroyed()) createPlainWindow()
    ipc.navigate(route)
    focusMainWindow()
  }

  buildMenu({
    repo,
    versions,
    openExternal: open,
    onCheckForUpdates: async () => {
      try {
        await updater.check()
      } catch (err) {
        logError('menu check failed:', err)
      }
      navigate('/settings')
    },
  })

  /** Re-activation (macOS dock click with no windows): main window without a splash. */
  function createPlainWindow() {
    const win = createMainWindow(windowOptions)
    mainWindow = win
    win.once('ready-to-show', () => win.show())
    win.on('closed', () => {
      if (mainWindow === win) mainWindow = null
    })
    win.loadURL(startUrl).catch((err) => logError('load failed:', err.message))
    return win
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createPlainWindow()
  })

  await boot({ active, ipc, updater, windowOptions, startUrl })
}

/**
 * Splash → hidden main window → show when ready. Boot-time failures on a
 * downloaded bundle quarantine it and relaunch; the built-in bundle is trusted.
 */
async function boot({ active, ipc, updater, windowOptions, startUrl }) {
  const splash = createSplash({
    shell: app.getVersion(),
    bundle: active.version,
    minimumMs: timing.splashMinimumMs,
    credit: readSplashCredit(),
    log,
  })

  const win = createMainWindow(windowOptions)
  mainWindow = win
  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null
  })
  const wc = win.webContents

  const outcome = await new Promise((resolve) => {
    let settled = false
    const cleanup = []
    const settle = (value) => {
      if (settled) return
      settled = true
      for (const fn of cleanup) fn()
      resolve(value)
    }
    const fail = (reason) => settle({ ok: false, reason })

    cleanup.push(ipc.onReady((sender) => sender === wc && settle({ ok: true, how: 'ready' })))

    const onFinish = () => {
      if (!active.builtIn) return
      const t = setTimeout(() => settle({ ok: true, how: 'did-finish-load' }), timing.finishLoadGraceMs)
      cleanup.push(() => clearTimeout(t))
    }
    const onFailLoad = (_event, code, description, _url, isMainFrame) => {
      // -3 is ERR_ABORTED: a superseded navigation, not a broken page.
      if (isMainFrame && code !== -3) fail(`did-fail-load ${code} ${description}`)
    }
    const onGone = (_event, details) => fail(`render-process-gone (${details.reason}, exit ${details.exitCode})`)
    const onClosed = () => settle({ ok: false, reason: 'closed' })

    wc.once('did-finish-load', onFinish)
    wc.on('did-fail-load', onFailLoad)
    wc.on('render-process-gone', onGone)
    win.once('closed', onClosed)
    cleanup.push(() => {
      wc.removeListener('did-finish-load', onFinish)
      wc.removeListener('did-fail-load', onFailLoad)
      wc.removeListener('render-process-gone', onGone)
      win.removeListener('closed', onClosed)
    })

    if (!active.builtIn) {
      const watchdog = setTimeout(() => fail(`no orbit:ready within ${timing.watchdogMs} ms`), timing.watchdogMs)
      cleanup.push(() => clearTimeout(watchdog))
    }

    win.loadURL(startUrl).catch((err) => log('loadURL rejected (handled via events):', err.message))
  })

  if (quitting) return

  if (!outcome.ok) {
    if (outcome.reason === 'closed') {
      splash.close()
      return
    }
    logError(`boot failed on ${active.builtIn ? 'built-in' : 'downloaded'} bundle ${active.version}: ${outcome.reason}`)
    if (!active.builtIn) {
      await splash.status('This update failed to start. Restoring the previous version…')
      try {
        updater.quarantine(active.version)
      } catch (err) {
        logError('quarantine failed:', err)
      }
      relaunch()
      return
    }
    const message = 'Could not start ORBIT. The built-in curriculum bundle failed to load; please reinstall the app.'
    await splash.error(message)
    dialog.showErrorBox('Could not start ORBIT', `${message}\n\n${outcome.reason}`)
    app.quit()
    return
  }

  log(`renderer ready (${outcome.how})`)
  await splash.waitMinimum()
  if (quitting || win.isDestroyed()) {
    splash.close()
    return
  }
  win.show()
  win.focus()
  await splash.dismiss()

  wc.on('render-process-gone', (_event, details) => logError('renderer gone after boot:', details.reason))
  wc.on('did-fail-load', (_event, code, description, url, isMainFrame) => {
    if (isMainFrame && code !== -3) logError(`load failed after boot: ${code} ${description} ${url}`)
  })

  if (!env.e2e) {
    setTimeout(() => {
      updater.check().catch((err) => logError('automatic update check failed:', err))
    }, timing.autoCheckDelayMs)
  }
}
