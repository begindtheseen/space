#!/usr/bin/env node
// End-to-end run of the ORBIT desktop shell (contract §10).
//
// Launches the real Electron app under Playwright against a fake GitHub API on
// localhost and walks the whole update story: check → download → restart →
// rollback → quarantine → token. Every step asserts and logs; the process exits
// 0 only if every assertion passed. Screenshots land in release/e2e/.
//
//   npm run build:bundle                      # dist/ must exist and be stamped
//   xvfb-run -a node desktop/test/e2e.mjs     # (--no-sandbox is passed for root)
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import electronPath from 'electron'
import { _electron } from 'playwright'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const distDir = path.join(root, 'dist')
const outDir = path.join(root, 'release', 'e2e')
const REPO = 'begindtheseen/space'
const UPDATE_VERSION = '9.9.9'
// The built-in bundle is whatever the repo is at; the fake update is far above it.
const BUILT_IN_VERSION = readJson(path.join(root, 'package.json')).version
const TOKEN = 'ghp_' + 'a'.repeat(36)
const GLOBAL_TIMEOUT_MS = 6 * 60_000

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const now = () => new Date().toISOString().slice(11, 23)
const log = (...args) => console.log(`[e2e ${now()}]`, ...args)
const warnings = []
const warn = (message) => {
  warnings.push(message)
  log('  warn', message)
}

class AssertionError extends Error {
  name = 'AssertionError'
}

function assert(condition, message) {
  if (!condition) throw new AssertionError(message)
  log('  ok', message)
}

function assertEqual(actual, expected, what) {
  assert(actual === expected, `${what}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function pngSize(file) {
  const buf = fs.readFileSync(file)
  if (buf.length < 24 || buf.toString('latin1', 0, 8) !== '\x89PNG\r\n\x1a\n') throw new AssertionError(`${file} is not a PNG`)
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

function withTimeout(promise, ms, what) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new AssertionError(`${what} did not happen within ${ms} ms`)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

// ── fixtures ───────────────────────────────────────────────────────────────────

/** A copy of dist/ re-stamped as `version`, zipped with the zip CLI like scripts/make-bundle.mjs does. */
function buildBundleFixture(workDir, version) {
  const dir = path.join(workDir, `bundle-${version}`)
  fs.cpSync(distDir, dir, { recursive: true })
  const metaFile = path.join(dir, 'orbit-bundle.json')
  const meta = readJson(metaFile)
  meta.version = version
  fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2) + '\n')
  const zip = path.join(workDir, `orbit-bundle-${version}.zip`)
  execFileSync('zip', ['-r', '-X', '-q', zip, '.'], { cwd: dir, stdio: 'inherit' })
  const buf = fs.readFileSync(zip)
  return { dir, zip, buf, size: buf.length, sha256: createHash('sha256').update(buf).digest('hex'), minShell: meta.minShell }
}

function buildManifest(fixture, version) {
  const downloads = `https://github.com/${REPO}/releases/download/v${version}`
  return {
    schema: 1,
    version,
    publishedAt: new Date().toISOString(),
    notes: `## What changed\n\n- End-to-end test release ${version}\n- Nothing in here is real`,
    bundle: {
      name: `orbit-bundle-${version}.zip`,
      url: `${downloads}/orbit-bundle-${version}.zip`,
      sha256: fixture.sha256,
      size: fixture.size,
      minShell: fixture.minShell,
    },
    shell: {
      version,
      dmgUrl: `${downloads}/ORBIT-${version}-universal.dmg`,
      zipUrl: `${downloads}/ORBIT-${version}-universal-mac.zip`,
    },
  }
}

// ── fake GitHub ────────────────────────────────────────────────────────────────

/**
 * GET /repos/<repo>/releases/latest → release JSON whose asset `url`s point at
 * /assets/N; /assets/N → 302 to /files/<name>; /files/<name> serves the bytes.
 * Records every request and every header violation (checked at the end).
 */
async function startFakeGitHub(fixture, manifest) {
  const state = { expectedToken: null, requests: [], failures: [], port: 0 }
  const manifestBytes = Buffer.from(JSON.stringify(manifest, null, 2))
  const files = {
    'orbit-manifest.json': manifestBytes,
    [`orbit-bundle-${UPDATE_VERSION}.zip`]: fixture.buf,
  }
  const release = {
    id: 1,
    tag_name: `v${UPDATE_VERSION}`,
    name: `ORBIT ${UPDATE_VERSION}`,
    draft: false,
    prerelease: false,
    published_at: manifest.publishedAt,
    body: manifest.notes,
    assets: [
      { id: 1, name: 'orbit-manifest.json', url: '/assets/1', size: manifestBytes.length, content_type: 'application/json' },
      { id: 2, name: `orbit-bundle-${UPDATE_VERSION}.zip`, url: '/assets/2', size: fixture.size, content_type: 'application/zip' },
    ],
  }
  const redirects = { '/assets/1': '/files/orbit-manifest.json', '/assets/2': `/files/orbit-bundle-${UPDATE_VERSION}.zip` }

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1')
    const auth = req.headers.authorization
    state.requests.push({
      method: req.method,
      path: url.pathname,
      authorization: auth ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      accept: req.headers.accept ?? null,
    })
    const fail = (why) => state.failures.push(`${req.method} ${url.pathname}: ${why}`)

    if (url.pathname === `/repos/${REPO}/releases/latest`) {
      const ua = req.headers['user-agent'] ?? ''
      if (!ua.startsWith('ORBIT-desktop/')) fail(`User-Agent ${JSON.stringify(ua)} does not start with "ORBIT-desktop/"`)
      if (req.headers.accept !== 'application/vnd.github+json') fail(`Accept is ${JSON.stringify(req.headers.accept)}`)
      if (req.headers['x-github-api-version'] !== '2022-11-28') fail(`X-GitHub-Api-Version is ${JSON.stringify(req.headers['x-github-api-version'])}`)
      if (state.expectedToken === null) {
        if (auth !== undefined) fail(`Authorization header sent although no token is stored: ${JSON.stringify(auth)}`)
      } else if (auth !== `Bearer ${state.expectedToken}`) {
        fail(`expected "Bearer <token>", got ${JSON.stringify(auth ?? null)}`)
      }
      const body = JSON.stringify(release)
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) })
      res.end(body)
      return
    }

    if (redirects[url.pathname]) {
      if (req.headers.accept !== 'application/octet-stream') fail(`Accept is ${JSON.stringify(req.headers.accept)}, not application/octet-stream`)
      res.writeHead(302, { Location: redirects[url.pathname], 'Content-Length': 0 })
      res.end()
      return
    }

    if (url.pathname.startsWith('/files/')) {
      // GitHub bounces asset downloads to signed storage URLs that reject a bearer token.
      if (auth !== undefined) fail(`Authorization header survived the redirect: ${JSON.stringify(auth.slice(0, 16) + '…')}`)
      const bytes = files[url.pathname.slice('/files/'.length)]
      if (!bytes) {
        res.writeHead(404, { 'Content-Length': 0 })
        res.end()
        return
      }
      res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Length': bytes.length })
      res.end(bytes)
      return
    }

    fail('unexpected request')
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('not found')
  })

  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  state.port = server.address().port
  return {
    state,
    apiBase: `http://127.0.0.1:${state.port}`,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  }
}

// ── electron helpers ───────────────────────────────────────────────────────────

class Harness {
  constructor({ userData, apiBase }) {
    this.userData = userData
    this.apiBase = apiBase
    this.launches = 0
    this.app = null
  }

  /** Launches the app; resolves with the ElectronApplication plus an `exited` promise. */
  async launch(label, extraEnv = {}) {
    this.launches += 1
    const tag = `${String(this.launches).padStart(2, '0')}-${label}`
    log(`launch ${tag}`)
    const app = await _electron.launch({
      executablePath: electronPath,
      // --no-sandbox: this harness runs as root in some sandboxes. --disable-gpu and
      // --disable-dev-shm-usage: on CI's xvfb there is no GPU process worth having, and
      // capturePage() has been seen to fail with UnknownVizError when Chromium tries to
      // use one anyway; software compositing is deterministic there.
      args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '.'],
      cwd: root,
      env: {
        ...process.env,
        ORBIT_E2E: '1',
        ORBIT_USER_DATA: this.userData,
        ORBIT_UPDATE_API_BASE: this.apiBase,
        ...extraEnv,
      },
      timeout: 45_000,
    })
    const proc = app.process()
    // Synchronous appends: the harness may exit right after the app does, and
    // a buffered stream would lose the last (most interesting) lines.
    const logFile = path.join(outDir, `electron-${tag}.log`)
    const append = (chunk) => fs.appendFileSync(logFile, chunk)
    proc.stdout?.on('data', append)
    proc.stderr?.on('data', append)
    const exited = new Promise((resolve) => {
      proc.once('exit', (code, signal) => {
        log(`exit ${tag}: code ${code} signal ${signal}`)
        resolve({ code, signal })
      })
    })
    const handle = { app, proc, exited, tag, done: false }
    exited.then(() => {
      handle.done = true
      if (this.app === handle) this.app = null
    })
    this.app = handle
    return handle
  }

  /** The page behind the first BrowserWindow whose URL matches. */
  async waitForPage(handle, test, what, timeout = 30_000) {
    const deadline = Date.now() + timeout
    while (Date.now() < deadline) {
      for (const page of handle.app.windows()) {
        if (test(page.url())) return page
      }
      if (handle.done) throw new AssertionError(`${what}: the app exited first`)
      await sleep(100)
    }
    throw new AssertionError(`${what} did not appear within ${timeout} ms (windows: ${handle.app.windows().map((p) => p.url()).join(', ') || 'none'})`)
  }

  /** Main window: loaded from app://orbit/, shown, titled ORBIT, bridge present. */
  async waitForMain(handle) {
    const page = await this.waitForPage(handle, (url) => url.startsWith('app://orbit/'), 'main window')
    await page.waitForFunction(() => typeof window.orbit === 'object' && window.orbit !== null, null, { timeout: 30_000 })
    await withTimeout(
      (async () => {
        for (;;) {
          const shown = await handle.app.evaluate(({ BrowserWindow }) =>
            BrowserWindow.getAllWindows().some((w) => !w.isDestroyed() && w.getTitle() === 'ORBIT' && w.isVisible()),
          )
          if (shown) return
          await sleep(100)
        }
      })(),
      30_000,
      'main window becoming visible',
    )
    return page
  }

  /** The splash BrowserWindow, once it is visible; `first` says it was the first window created. */
  async waitForSplash(handle, timeout = 15_000) {
    return withTimeout(
      (async () => {
        for (;;) {
          if (handle.done) throw new AssertionError('splash window: the app exited first')
          const info = await handle.app.evaluate(({ BrowserWindow }) => {
            const all = BrowserWindow.getAllWindows().filter((w) => !w.isDestroyed())
            const splash = all.find((w) => w.webContents.getURL().includes('/splash.html'))
            if (!splash) return null
            const [width, height] = splash.getSize()
            const lowestId = Math.min(...all.map((w) => w.id))
            return { id: splash.id, url: splash.webContents.getURL(), visible: splash.isVisible(), width, height, first: splash.id === lowestId }
          })
          if (info && info.visible) return info
          await sleep(50)
        }
      })(),
      timeout,
      'splash window becoming visible',
    )
  }

  /** Resolves true when the splash photo has loaded, or with the reason it did not (≤ 2 s). */
  async waitForSplashPhoto(handle, id) {
    return handle.app.evaluate(({ BrowserWindow }, windowId) => {
      const win = BrowserWindow.fromId(windowId)
      if (!win || win.isDestroyed()) return 'splash already closed'
      const loaded = win.webContents.executeJavaScript(
        `new Promise((resolve) => {
          const img = document.getElementById('photo')
          if (!img) return resolve('no #photo element')
          if (img.complete) return resolve(img.naturalWidth > 0 ? true : 'photo missing')
          img.addEventListener('load', () => resolve(true))
          img.addEventListener('error', () => resolve('photo failed to load'))
        })`,
        true,
      )
      const timeout = new Promise((resolve) => setTimeout(() => resolve('not loaded within 2 s'), 2000))
      return Promise.race([loaded, timeout]).catch((err) => `script failed: ${err.message}`)
    }, id)
  }

  /** PNG (base64) of the splash window plus the text it shows. */
  async captureSplash(handle, id) {
    return handle.app.evaluate(async ({ BrowserWindow }, windowId) => {
      const win = BrowserWindow.fromId(windowId)
      if (!win || win.isDestroyed()) return null
      const [version, wordmark] = await Promise.all([
        win.webContents.executeJavaScript('document.getElementById("version").textContent', true).catch(() => null),
        win.webContents.executeJavaScript('document.querySelector(".wordmark").textContent', true).catch(() => null),
      ])
      // capturePage() can fail transiently on a headless display (UnknownVizError while
      // the compositor is still coming up); retry, and report rather than throw so the
      // screenshot stays best-effort while the text assertions still run.
      let png = null
      let captureError = null
      for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
          const image = await win.webContents.capturePage()
          if (!image.isEmpty()) {
            png = image.toPNG().toString('base64')
            captureError = null
            break
          }
          captureError = 'capturePage returned an empty image'
        } catch (err) {
          captureError = err instanceof Error ? err.message : String(err)
        }
        await new Promise((r) => setTimeout(r, 400))
      }
      return { png, captureError, version, wordmark }
    }, id)
  }

  async bridge(page) {
    return page.evaluate(() => ({
      defined: typeof window.orbit === 'object' && window.orbit !== null,
      platform: window.orbit?.platform,
      versions: window.orbit?.versions,
      title: document.title,
    }))
  }

  /** Waits for the process to exit on its own (apply/rollback/quarantine quit in E2E mode). */
  async expectExit(handle, timeout, what) {
    const { code, signal } = await withTimeout(handle.exited, timeout, what)
    assert(code === 0 && signal === null, `${what}: exit code ${code}${signal ? ` (signal ${signal})` : ''}`)
  }

  async closeCurrent() {
    const handle = this.app
    if (!handle || handle.done) return
    await handle.app.close().catch(() => {})
    await withTimeout(handle.exited, 15_000, `close ${handle.tag}`).catch(() => {
      handle.proc.kill('SIGKILL')
    })
  }

  async killAll() {
    const handle = this.app
    if (!handle || handle.done) return
    try {
      handle.proc.kill('SIGKILL')
    } catch {
      // already gone
    }
  }
}

/** Polls the updater state over the bridge until `done(status)` holds. */
async function waitForStatus(page, done, timeout, what) {
  const deadline = Date.now() + timeout
  let last = null
  while (Date.now() < deadline) {
    last = await page.evaluate(() => window.orbit.updates.getState())
    if (done(last.status)) return last
    await sleep(100)
  }
  throw new AssertionError(`${what}: still ${JSON.stringify(last?.status)} after ${timeout} ms${last?.error ? ` (${last.error})` : ''}`)
}

const updatesCard = (page) => page.locator('.card').filter({ has: page.locator('.card-head__title .eyebrow', { hasText: /^Updates$/ }) })

async function openSettings(page) {
  await page.evaluate(() => {
    location.hash = '#/settings'
  })
  const card = updatesCard(page)
  await card.waitFor({ state: 'visible', timeout: 15_000 })
  return card
}

async function screenshot(page, name, locatorToReveal) {
  if (locatorToReveal) await locatorToReveal.scrollIntoViewIfNeeded()
  const file = path.join(outDir, name)
  try {
    await page.screenshot({ path: file })
  } catch (err) {
    // Same headless-compositor caveat as the splash: the image is an artifact,
    // not the thing under test.
    warn(`${name} could not be captured on this display: ${err instanceof Error ? err.message : err}`)
    return null
  }
  const size = pngSize(file)
  log(`  screenshot ${path.relative(root, file)} (${size.width}×${size.height})`)
  return size
}

// ── the run ────────────────────────────────────────────────────────────────────

const STEPS = [
  [1, 'Fake GitHub API + bundle fixture (headers asserted across the whole run)'],
  [2, 'Launch: splash screenshot, main window, bridge versions, home screenshot'],
  [3, 'Settings: check → 9.9.9 → download → restart; bundle on disk; current.json'],
  [4, 'Relaunch on 9.9.9, roll back, relaunch on built-in'],
  [5, 'Quarantine: bundles that never call ready(), or crash in their first render, are quit and blacklisted'],
  [6, 'Token: Bearer sent to the API, dropped after the redirect'],
  [7, 'Automatic: check → downloads and stages on its own → quit (no restart) → next launch is 9.9.9'],
  [8, 'Every assertion passed'],
]
const results = new Map()
const record = (step, ok, note = '') => results.set(step, { ok, note })

async function runStep(step, fn) {
  const title = STEPS.find(([n]) => n === step)[1]
  log(`── step ${step}: ${title}`)
  try {
    await fn()
    record(step, true)
  } catch (err) {
    record(step, false, err instanceof Error ? err.message : String(err))
    throw err
  }
}

function printSummary() {
  const width = Math.max(...STEPS.map(([, t]) => t.length))
  console.log('')
  console.log(`  ${'step'.padEnd(5)} ${'result'.padEnd(8)} ${'what'.padEnd(width)}`)
  console.log(`  ${'-'.repeat(5)} ${'-'.repeat(8)} ${'-'.repeat(width)}`)
  for (const [n, title] of STEPS) {
    const r = results.get(n)
    const verdict = r === undefined ? 'not run' : r.ok ? 'PASS' : 'FAIL'
    console.log(`  ${String(n).padEnd(5)} ${verdict.padEnd(8)} ${title}`)
    if (r && !r.ok && r.note) console.log(`  ${''.padEnd(5)} ${''.padEnd(8)} ↳ ${r.note}`)
  }
  console.log('')
}

async function main() {
  if (!fs.existsSync(path.join(distDir, 'index.html')) || !fs.existsSync(path.join(distDir, 'orbit-bundle.json'))) {
    throw new Error('dist/ is not a stamped build; run `npm run build:bundle` first')
  }
  const builtIn = readJson(path.join(distDir, 'orbit-bundle.json'))
  if (builtIn.version !== BUILT_IN_VERSION) {
    throw new Error(`dist/orbit-bundle.json is ${builtIn.version}; this run expects the built-in bundle to be ${BUILT_IN_VERSION}`)
  }

  fs.rmSync(outDir, { recursive: true, force: true })
  fs.mkdirSync(outDir, { recursive: true })
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-e2e-fixture-'))
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-e2e-userdata-'))
  const bundlesDir = path.join(userData, 'bundles')
  const currentFile = path.join(bundlesDir, 'current.json')
  const badFile = path.join(bundlesDir, 'bad.json')

  let github = null
  let harness = null
  let failed = false

  try {
    // 1 ───────────────────────────────────────────────────────────────────────
    let fixture
    await runStep(1, async () => {
      fixture = buildBundleFixture(workDir, UPDATE_VERSION)
      assert(fixture.size > 0 && /^[0-9a-f]{64}$/.test(fixture.sha256), `fixture orbit-bundle-${UPDATE_VERSION}.zip: ${fixture.size} bytes, sha256 ${fixture.sha256.slice(0, 12)}…`)
      assertEqual(readJson(path.join(fixture.dir, 'orbit-bundle.json')).version, UPDATE_VERSION, 'fixture orbit-bundle.json.version')
      github = await startFakeGitHub(fixture, buildManifest(fixture, UPDATE_VERSION))
      assert(github.state.port > 0, `fake GitHub API listening on ${github.apiBase}`)
      harness = new Harness({ userData, apiBase: github.apiBase })
    })

    // 2 ───────────────────────────────────────────────────────────────────────
    let handle
    let page
    await runStep(2, async () => {
      handle = await harness.launch('first')
      // The splash lives for well under two seconds, and Playwright only lists a
      // window once its first navigation has committed, so the splash is found
      // and captured through the main process rather than through a Page.
      const splash = await harness.waitForSplash(handle)
      assert(splash.first, `first window is the splash (${splash.url.split('?')[0].split('/').pop()}, id ${splash.id})`)
      assert(splash.width === 760 && splash.height === 460, `splash window is 760×460 (got ${splash.width}×${splash.height})`)
      const photo = await harness.waitForSplashPhoto(handle, splash.id)
      if (photo !== true) log(`  (splash photo: ${photo}; capturing anyway)`)
      const captured = await harness.captureSplash(handle, splash.id)
      assert(captured !== null, 'splash captured before it closed')
      if (captured.png) {
        fs.writeFileSync(path.join(outDir, 'splash.png'), Buffer.from(captured.png, 'base64'))
        const splashSize = pngSize(path.join(outDir, 'splash.png'))
        log(`  screenshot release/e2e/splash.png (${splashSize.width}×${splashSize.height})`)
        assert(splashSize.width === 760 && splashSize.height === 460, `splash.png is 760×460 (got ${splashSize.width}×${splashSize.height})`)
      } else {
        // The pixels are an artifact for humans, not what this step verifies.
        warn(`splash screenshot unavailable on this display: ${captured.captureError}`)
      }
      assertEqual(captured.version, `v${BUILT_IN_VERSION} · bundle ${BUILT_IN_VERSION}`, 'splash version line')
      assertEqual(captured.wordmark, 'ORBIT', 'splash wordmark')

      page = await harness.waitForMain(handle)
      const title = await handle.app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().find((w) => w.isVisible())?.getTitle())
      assertEqual(title, 'ORBIT', 'main BrowserWindow title')
      const info = await harness.bridge(page)
      assert(info.defined, 'window.orbit is defined')
      assert(typeof info.title === 'string' && info.title.includes('ORBIT'), `document title names ORBIT (${JSON.stringify(info.title)})`)
      assertEqual(info.versions?.bundle, BUILT_IN_VERSION, 'orbit.versions.bundle')
      assertEqual(info.versions?.builtIn, BUILT_IN_VERSION, 'orbit.versions.builtIn')
      assertEqual(info.versions?.shell, readJson(path.join(root, 'package.json')).version, 'orbit.versions.shell')
      assert(/^\d+\.\d+\.\d+/.test(String(info.versions?.electron)), `orbit.versions.electron is ${info.versions?.electron}`)
      // The splash must be gone once the main window is up.
      await withTimeout(
        (async () => {
          for (;;) {
            const count = await handle.app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().filter((w) => !w.isDestroyed()).length)
            if (count === 1) return
            await sleep(100)
          }
        })(),
        10_000,
        'splash window closing',
      )
      assert(true, 'splash closed; one window remains')
      const win = await handle.app.evaluate(({ BrowserWindow }) => {
        const w = BrowserWindow.getAllWindows().find((x) => !x.isDestroyed() && x.isVisible())
        const [width, height] = w.getSize()
        const [contentWidth, contentHeight] = w.getContentSize()
        return { width, height, contentWidth, contentHeight, menuBar: w.isMenuBarVisible(), platform: process.platform }
      })
      assert(win.width === 1280 && win.height === 820, `main window is 1280×820 (got ${win.width}×${win.height})`)
      const homeSize = await screenshot(page, 'home.png')
      // On macOS the menu lives in the system bar, so the page is the whole 1280×820
      // window; on Linux/Windows Electron draws the menu bar inside the window and
      // the page is the window minus that bar (the window itself is still 1280×820).
      const menuBarHeight = win.platform !== 'darwin' && win.menuBar ? win.height - win.contentHeight : 0
      if (homeSize) {
      assert(
          homeSize.width === 1280 && homeSize.height === 820 - menuBarHeight && menuBarHeight >= 0 && menuBarHeight < 60,
          `home.png is 1280×${820 - menuBarHeight} (the 1280×820 window${menuBarHeight ? ` minus the ${menuBarHeight} px in-window menu bar on ${win.platform}` : ''}; got ${homeSize.width}×${homeSize.height})`,
        )
      }
    })

    // 3 ───────────────────────────────────────────────────────────────────────
    await runStep(3, async () => {
      const card = await openSettings(page)
      assert((await card.count()) === 1, 'Settings shows the Updates card')
      const stateBefore = await page.evaluate(() => window.orbit.updates.getState())
      assertEqual(stateBefore.status, 'idle', 'updater status before the check')
      assertEqual(stateBefore.canRollback, false, 'canRollback on the built-in bundle')

      await card.getByRole('button', { name: 'Check for updates' }).click()
      const available = await waitForStatus(page, (s) => s !== 'idle' && s !== 'checking', 20_000, 'check to finish')
      assertEqual(available.status, 'available', `status after check${available.error ? ` (error: ${available.error})` : ''}`)
      await card.getByText(UPDATE_VERSION).first().waitFor({ timeout: 10_000 })
      assert(true, `"${UPDATE_VERSION}" appears after Check for updates`)
      assertEqual(available.latest?.version, UPDATE_VERSION, 'latest.version')
      assertEqual(available.latest?.size, fixture.size, 'latest.size')
      await screenshot(page, 'settings-available.png', card)

      await card.getByRole('button', { name: 'Download', exact: true }).click()
      const ready = await waitForStatus(page, (s) => s !== 'available' && s !== 'downloading', 60_000, 'download to finish')
      assertEqual(ready.status, 'ready', `status after download${ready.error ? ` (error: ${ready.error})` : ''}`)
      const restart = card.getByRole('button', { name: 'Restart now' })
      await restart.waitFor({ timeout: 10_000 })
      assert(true, '"Restart now" appears after Download')
      await screenshot(page, 'settings-updates.png', card)

      const installed = path.join(bundlesDir, UPDATE_VERSION)
      assert(fs.existsSync(path.join(installed, 'index.html')), `${path.relative(userData, installed)}/index.html exists`)
      assertEqual(readJson(path.join(installed, 'orbit-bundle.json')).version, UPDATE_VERSION, 'installed orbit-bundle.json.version')
      assert(!fs.existsSync(path.join(bundlesDir, 'tmp', `${UPDATE_VERSION}.zip`)), 'temporary zip removed after extraction')

      await restart.click({ noWaitAfter: true }).catch(() => {})
      await harness.expectExit(handle, 20_000, 'app quits after Restart now')
      const current = readJson(currentFile)
      assertEqual(current.version, UPDATE_VERSION, 'current.json.version after apply')
      assertEqual(current.previous, BUILT_IN_VERSION, 'current.json.previous after apply')
    })

    // 4 ───────────────────────────────────────────────────────────────────────
    await runStep(4, async () => {
      handle = await harness.launch('updated')
      page = await harness.waitForMain(handle)
      const info = await harness.bridge(page)
      assertEqual(info.versions?.bundle, UPDATE_VERSION, 'orbit.versions.bundle on relaunch')
      const state = await page.evaluate(() => window.orbit.updates.getState())
      assertEqual(state.current, UPDATE_VERSION, 'state.current on relaunch')
      assertEqual(state.canRollback, true, 'canRollback on the downloaded bundle')

      const card = await openSettings(page)
      const rollbackButton = card.getByRole('button', { name: 'Roll back', exact: true })
      await rollbackButton.waitFor({ timeout: 15_000 })
      assert(true, 'Settings shows Roll back')
      await rollbackButton.click()
      const confirm = card.getByRole('button', { name: 'Yes, roll back' })
      await confirm.waitFor({ timeout: 10_000 })
      await confirm.click({ noWaitAfter: true }).catch(() => {})
      await harness.expectExit(handle, 20_000, 'app quits after rollback()')
      assertEqual(readJson(currentFile).version, null, 'current.json.version after rollback')

      handle = await harness.launch('rolled-back')
      page = await harness.waitForMain(handle)
      const back = await harness.bridge(page)
      assertEqual(back.versions?.bundle, BUILT_IN_VERSION, 'orbit.versions.bundle after rollback')
      assertEqual(readJson(currentFile).version, null, 'current.json.version stays null')
      assert(!fs.existsSync(path.join(bundlesDir, UPDATE_VERSION)), `bundles/${UPDATE_VERSION} garbage-collected at boot`)
      await harness.closeCurrent()
    })

    // 5 ───────────────────────────────────────────────────────────────────────
    await runStep(5, async () => {
      const broken = path.join(bundlesDir, UPDATE_VERSION)
      /** Reinstalls the fixture as the current bundle with its index.html rewritten by `mutate`. */
      const installBroken = (what, mutate) => {
        fs.rmSync(broken, { recursive: true, force: true })
        fs.cpSync(fixture.dir, broken, { recursive: true })
        const indexFile = path.join(broken, 'index.html')
        fs.writeFileSync(indexFile, mutate(fs.readFileSync(indexFile, 'utf8')))
        fs.rmSync(badFile, { force: true })
        fs.writeFileSync(currentFile, JSON.stringify({ version: UPDATE_VERSION, previous: null }, null, 2) + '\n')
        assertEqual(readJson(currentFile).version, UPDATE_VERSION, `current.json points at the ${what} bundle`)
      }
      const expectQuarantined = async (what) => {
        const bad = readJson(badFile)
        assert(Array.isArray(bad.versions) && bad.versions.includes(UPDATE_VERSION), `bad.json lists ${UPDATE_VERSION} after the ${what} bundle: ${JSON.stringify(bad)}`)
        assertEqual(readJson(currentFile).version, null, `current.json.version reset by quarantining the ${what} bundle`)
      }

      // (a) A page that never calls ready() at all.
      installBroken(
        'silent',
        () =>
          '<!doctype html><html><head><meta charset="utf-8"><title>broken</title></head><body style="background:#000208;color:#fff">This bundle never calls window.orbit.ready().</body></html>\n',
      )
      let started = Date.now()
      handle = await harness.launch('broken-silent')
      await harness.expectExit(handle, 12_000, 'app quits on its own with a bundle that never reports ready')
      log(`  quit after ${Date.now() - started} ms`)
      await expectQuarantined('silent')

      // (b) The real bundle, but its React tree throws during the first render:
      // useRoute() parses location.hash with URLSearchParams synchronously, so
      // sabotaging that constructor before the app's module script runs makes
      // the first render throw. The boundary takes over the tree, so the page
      // is not empty — ready() must still not be sent, and the watchdog must
      // quarantine the bundle exactly as for (a).
      installBroken('crashing', (html) => {
        const sabotage = '<script>window.URLSearchParams = function () { throw new Error("e2e: sabotaged first render") }</script>'
        assert(html.includes('<head>'), 'fixture index.html has a <head> to inject into')
        return html.replace('<head>', `<head>${sabotage}`)
      })
      started = Date.now()
      handle = await harness.launch('broken-crashing')
      // Best effort: the hidden window's page exists once the navigation commits.
      const crashPage = await harness.waitForPage(handle, (url) => url.startsWith('app://orbit/'), 'crashing bundle page', 8_000).catch(() => null)
      if (crashPage) {
        const crashShown = await crashPage
          .waitForSelector('[data-orbit-crash]', { state: 'attached', timeout: 2_500 })
          .then(() => true)
          .catch(() => false)
        log(`  crash screen rendered in the hidden window: ${crashShown}`)
      }
      await harness.expectExit(handle, 12_000, 'app quits on its own with a bundle whose first render throws')
      log(`  quit after ${Date.now() - started} ms`)
      await expectQuarantined('crashing')

      handle = await harness.launch('after-quarantine')
      page = await harness.waitForMain(handle)
      const info = await harness.bridge(page)
      assertEqual(info.versions?.bundle, BUILT_IN_VERSION, 'orbit.versions.bundle after quarantine')
      assert(!fs.existsSync(broken), 'quarantined bundle directory garbage-collected')
    })

    // 6 ───────────────────────────────────────────────────────────────────────
    await runStep(6, async () => {
      const saved = await page.evaluate((t) => window.orbit.updates.setToken(t), TOKEN)
      assertEqual(saved.hasToken, true, 'state.hasToken after setToken')
      assert(saved.status !== 'error', `setToken did not error (${saved.error ?? 'no error'})`)
      const config = readJson(path.join(userData, 'config.json'))
      assert(typeof config.tokenEnc === 'string' || (typeof config.token === 'string' && config.plaintext === true), `config.json stores the token (${config.tokenEnc ? 'encrypted' : 'plaintext, flagged'})`)

      github.state.expectedToken = TOKEN
      const before = github.state.requests.length
      const checked = await page.evaluate(() => window.orbit.updates.check())
      assertEqual(checked.status, 'available', 'check() with a token')
      const requests = github.state.requests.slice(before)
      const api = requests.find((r) => r.path === `/repos/${REPO}/releases/latest`)
      assert(api !== undefined, 'server saw the releases/latest request')
      assertEqual(api.authorization, `Bearer ${TOKEN}`, 'Authorization on the API request')
      const redirected = requests.filter((r) => r.path.startsWith('/files/'))
      assert(redirected.length >= 1, `server saw ${redirected.length} redirected /files/* request(s)`)
      assert(redirected.every((r) => r.authorization === null), 'no Authorization header after the redirect')

      const cleared = await page.evaluate(() => window.orbit.updates.setToken(null))
      assertEqual(cleared.hasToken, false, 'state.hasToken after setToken(null)')
      github.state.expectedToken = null
      await harness.closeCurrent()
    })

    // 7 ───────────────────────────────────────────────────────────────────────
    await runStep(7, async () => {
      handle = await harness.launch('auto', { ORBIT_AUTO_UPDATE: '1' })
      page = await harness.waitForMain(handle)
      const before = await page.evaluate(() => window.orbit.updates.getState())
      assertEqual(before.autoUpdate, true, 'state.autoUpdate with ORBIT_AUTO_UPDATE=1')
      assertEqual(before.current, BUILT_IN_VERSION, 'running the built-in bundle before the update')

      // No Download, no Restart: the check alone brings it in.
      await page.evaluate(() => window.orbit.updates.check())
      const ready = await waitForStatus(page, (s) => s === 'ready' || s === 'error', 60_000, 'the automatic download to finish')
      assertEqual(ready.status, 'ready', `status after the automatic download${ready.error ? ` (error: ${ready.error})` : ''}`)
      assertEqual(ready.staged, true, 'state.staged')
      const current = readJson(currentFile)
      assertEqual(current.version, UPDATE_VERSION, 'current.json.version staged for the next launch')
      assertEqual(current.previous, BUILT_IN_VERSION, 'current.json.previous kept for the watchdog')

      const card = await openSettings(page)
      await card.getByText(/opens next time you start ORBIT/).first().waitFor({ timeout: 10_000 })
      assert(true, 'Settings says the update opens next time')
      await screenshot(page, 'settings-staged.png', card)

      // An ordinary quit — nobody presses Restart now.
      await harness.closeCurrent()
      handle = await harness.launch('auto-next')
      page = await harness.waitForMain(handle)
      const info = await harness.bridge(page)
      assertEqual(info.versions?.bundle, UPDATE_VERSION, 'orbit.versions.bundle on the next ordinary launch')
      await harness.closeCurrent()
    })

    // 8 ───────────────────────────────────────────────────────────────────────
    await runStep(8, async () => {
      assert(github.state.failures.length === 0, `fake GitHub recorded no header violations across ${github.state.requests.length} requests`)
      for (const name of ['splash.png', 'home.png', 'settings-updates.png']) {
        if (fs.existsSync(path.join(outDir, name))) log(`  ok release/e2e/${name} written`)
        else warn(`release/e2e/${name} was not produced on this display`)
      }
      const failedSteps = [...results.entries()].filter(([, r]) => !r.ok)
      assert(failedSteps.length === 0, 'steps 1–7 all passed')
    })
  } catch (err) {
    failed = true
    console.error(`\n[e2e] FAILED: ${err instanceof Error ? err.stack ?? err.message : String(err)}`)
    if (github && github.state.failures.length) {
      console.error('[e2e] header violations recorded by the fake GitHub API:')
      for (const f of github.state.failures) console.error(`  - ${f}`)
    }
    if (github) {
      console.error(`[e2e] requests seen by the fake GitHub API (${github.state.requests.length}):`)
      for (const r of github.state.requests) console.error(`  - ${r.method} ${r.path} auth=${r.authorization ? 'yes' : 'no'} ua=${r.userAgent}`)
    }
  } finally {
    await harness?.closeCurrent().catch(() => {})
    await harness?.killAll().catch(() => {})
    await github?.close().catch(() => {})
  }

  if (!failed && github.state.failures.length) {
    failed = true
    record(8, false, github.state.failures.join('; '))
  }
  printSummary()
  if (failed) {
    console.error(`[e2e] userData kept for inspection: ${userData}`)
    console.error(`[e2e] fixture kept for inspection: ${workDir}`)
    console.error(`[e2e] Electron logs: ${path.relative(root, outDir)}/electron-*.log`)
    return 1
  }
  fs.rmSync(workDir, { recursive: true, force: true })
  fs.rmSync(userData, { recursive: true, force: true })
  console.log(`[e2e] all steps passed; screenshots in ${path.relative(root, outDir)}/`)
  return 0
}

const guard = setTimeout(() => {
  console.error(`[e2e] global timeout of ${GLOBAL_TIMEOUT_MS / 1000} s reached`)
  printSummary()
  process.exit(2)
}, GLOBAL_TIMEOUT_MS)
guard.unref()

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(`[e2e] crashed: ${err instanceof Error ? err.stack ?? err.message : String(err)}`)
    printSummary()
    process.exit(1)
  },
)
