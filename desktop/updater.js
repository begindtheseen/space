// Curriculum-bundle updater. Pure Node: everything it touches (network,
// token, paths, versions) is injected so it runs the same in the Electron
// main process and under vitest with a local HTTP server.
//
// Lifecycle: resolveActive() once at boot → check() → download() → apply()
// (relaunch) … rollback()/quarantine() move current.json back.
//
// When the latest bundle needs a newer app than this one ('shell-required'),
// downloadShell() fetches that release's app, verifies it, and installShell()
// hands it to the platform installer, which swaps it in once ORBIT has quit
// and opens it: an app any number of versions behind jumps straight to the
// latest, in two taps, instead of waiting on a manual download.
//
// With `autoUpdate` it updates the way an ordinary app does, with no taps at
// all: whatever check() finds is downloaded in the background, a bundle is
// staged in current.json as soon as it is verified (so the next launch opens
// it, whether or not anyone presses Restart), and a downloaded app is swapped
// in when ORBIT quits (installOnExit()).

import { EventEmitter } from 'node:events'
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import * as semver from './semver.js'
import { extractZip, MAX_TOTAL_UNCOMPRESSED, ZipError } from './zip.js'

export const MANIFEST_ASSET = 'orbit-manifest.json'
export const BUNDLE_META = 'orbit-bundle.json'
/**
 * Largest bundle zip a manifest may declare. A zip cannot usefully be bigger
 * than what zip.js lets it expand to, and without a cap the release author
 * would decide how much disk the download may fill and how big a buffer
 * readFile() must allocate (Node refuses past 2 GiB).
 */
export const MAX_BUNDLE_BYTES = MAX_TOTAL_UNCOMPRESSED
const MAX_REDIRECTS = 5
export const MAX_MANIFEST_BYTES = 1024 * 1024
/** Largest app zip downloadShell() accepts. The universal app is a few hundred MB. */
export const MAX_SHELL_BYTES = 1024 * 1024 * 1024
const PROGRESS_INTERVAL_MS = 100
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308])
const SHA256_RE = /^[0-9a-f]{64}$/i
const REPO_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\/[A-Za-z0-9_.-]+$/

/** @param {string} version */
export const bundleAssetName = (version) => `orbit-bundle-${version}.zip`
/** @param {string} version */
export const shellAssetName = (version) => `ORBIT-${version}-universal-mac.zip`

/**
 * An update failure with a message fit for the Settings card.
 */
export class UpdateError extends Error {
  name = 'UpdateError'
  /**
   * @param {string} message
   * @param {{ needsToken?: boolean, cause?: unknown }} [opts]
   */
  constructor(message, opts = {}) {
    super(message, opts.cause === undefined ? undefined : { cause: opts.cause })
    this.needsToken = opts.needsToken === true
  }
}

/**
 * @typedef {'idle'|'checking'|'up-to-date'|'available'|'downloading'|'ready'|'error'|'shell-required'} UpdateStatus
 *
 * @typedef {object} Latest
 * @property {string} version
 * @property {string} notes
 * @property {string} publishedAt
 * @property {number} size
 * @property {string} sha256
 * @property {string} minShell
 * @property {string} [shellDownloadUrl]
 * @property {{ size: number, sha256: string }} [shellZip] the app zip's size and hash, when the release recorded them
 *
 * @typedef {object} ShellUpdateState
 * @property {'downloading'|'ready'|'error'|'manual'} status
 * @property {string} version
 * @property {{ received: number, total: number }} [progress]
 * @property {string} [error]
 *
 * @typedef {object} ShellInstaller Platform half of replacing the app itself (see shellInstall.js).
 * @property {() => { ok: true } | { ok: false, reason: string }} supported whether this copy of the app can replace itself
 * @property {(zip: string, dest: string) => Promise<void>} extract
 * @property {(dir: string) => string | null} findApp the app inside an extracted zip
 * @property {(app: string, version: string) => Promise<void>} verify throws when the app is not that version, or broken
 * @property {(app: string, workDir: string, opts?: { reopen?: boolean }) => void} install swaps `app` in once this process exits, then opens it (unless `reopen` is false)
 *
 * @typedef {object} UpdateState
 * @property {UpdateStatus} status
 * @property {string} current
 * @property {string} builtIn
 * @property {string} shell
 * @property {string} repo
 * @property {string} [checkedAt]
 * @property {Latest} [latest]
 * @property {{ received: number, total: number }} [progress]
 * @property {string} [error]
 * @property {boolean} [needsToken]
 * @property {boolean} hasToken
 * @property {boolean} canRollback
 * @property {ShellUpdateState} [shellUpdate]
 * @property {boolean} [autoUpdate] whether this updater downloads and installs on its own; absent only from shells before 1.1.3
 * @property {boolean} [staged] the downloaded bundle opens on the next launch even without a restart now
 *
 * @typedef {{ dir: string, version: string, builtIn: boolean }} ActiveBundle
 * @typedef {{ version: string | null, previous: string | null }} CurrentFile
 *
 * @typedef {object} UpdaterOptions
 * @property {string} repo GitHub `owner/name` that hosts Releases
 * @property {string} [apiBase] defaults to https://api.github.com
 * @property {string} userData Electron userData directory
 * @property {string} builtInDir directory of the bundle shipped inside the app
 * @property {string} shellVersion app.getVersion()
 * @property {typeof fetch} [fetchImpl]
 * @property {() => Promise<string | null> | string | null} [getToken]
 * @property {(...args: unknown[]) => void} [log]
 * @property {ShellInstaller} [shellInstaller] absent: the app can only be updated by hand
 * @property {boolean} [autoUpdate] download what check() finds, stage it, and install the app on quit
 */

/**
 * @param {unknown} err
 * @returns {string}
 */
function describe(err) {
  if (err instanceof Error) {
    const cause = /** @type {{ code?: unknown, message?: unknown }} */ (err.cause ?? {})
    if (typeof cause.code === 'string') return `${err.message}: ${cause.code}`
    if (typeof cause.message === 'string' && cause.message) return `${err.message}: ${cause.message}`
    return err.message
  }
  return String(err)
}

/**
 * @param {string} file
 * @param {(...args: unknown[]) => void} log
 * @returns {unknown} parsed JSON, or null when the file is missing or unreadable
 */
function readJson(file, log) {
  let text
  try {
    text = fs.readFileSync(file, 'utf8')
  } catch (err) {
    if (/** @type {{ code?: string }} */ (err).code !== 'ENOENT') log('updater: cannot read', file, describe(err))
    return null
  }
  try {
    return JSON.parse(text)
  } catch (err) {
    log('updater: ignoring corrupt', file, describe(err))
    return null
  }
}

/**
 * Write-then-rename so a crash mid-write never leaves a truncated file.
 * @param {string} file
 * @param {unknown} value
 */
function writeJsonAtomic(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  const tmp = `${file}.${process.pid}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2) + '\n')
  fs.renameSync(tmp, file)
}

/** @param {unknown} v */
const validVersion = (v) => typeof v === 'string' && semver.valid(v) ? v : null

/**
 * @param {unknown} raw
 * @returns {CurrentFile}
 */
function normalizeCurrent(raw) {
  const obj = raw && typeof raw === 'object' ? /** @type {Record<string, unknown>} */ (raw) : {}
  return { version: validVersion(obj.version), previous: validVersion(obj.previous) }
}

/**
 * @param {unknown} release
 * @param {string} name
 * @returns {{ name: string, url: string, size: number | null } | null}
 */
function findAsset(release, name) {
  const assets = release && typeof release === 'object' ? /** @type {{ assets?: unknown }} */ (release).assets : null
  if (!Array.isArray(assets)) return null
  for (const asset of assets) {
    if (asset && typeof asset === 'object' && asset.name === name && typeof asset.url === 'string') {
      return { name, url: asset.url, size: Number.isSafeInteger(asset.size) && asset.size > 0 ? asset.size : null }
    }
  }
  return null
}

/**
 * @param {unknown} raw
 * @returns {Latest & { bundleName: string }}
 */
function validateManifest(raw) {
  /** @param {string} why */
  const bad = (why) => new UpdateError(`The release manifest is invalid: ${why}.`)
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw bad('not an object')
  const m = /** @type {Record<string, unknown>} */ (raw)
  if (m.schema !== 1) throw bad(`unknown schema ${JSON.stringify(m.schema)}`)
  if (!validVersion(m.version)) throw bad('bad version')
  const version = /** @type {string} */ (m.version)
  if (typeof m.publishedAt !== 'string' || !Number.isFinite(Date.parse(m.publishedAt))) throw bad('bad publishedAt')
  if (m.notes !== undefined && typeof m.notes !== 'string') throw bad('notes must be a string')
  const notes = typeof m.notes === 'string' ? m.notes : ''

  if (!m.bundle || typeof m.bundle !== 'object') throw bad('missing bundle')
  const b = /** @type {Record<string, unknown>} */ (m.bundle)
  if (b.name !== bundleAssetName(version)) throw bad(`bundle name must be ${bundleAssetName(version)}`)
  if (!isHttpsUrl(b.url)) throw bad('bundle url must be https')
  if (typeof b.sha256 !== 'string' || !SHA256_RE.test(b.sha256)) throw bad('bundle sha256 must be 64 hex characters')
  if (typeof b.size !== 'number' || !Number.isSafeInteger(b.size) || b.size <= 0) throw bad('bundle size must be a positive integer')
  if (b.size > MAX_BUNDLE_BYTES) throw bad(`bundle size ${b.size} is over the ${MAX_BUNDLE_BYTES} byte limit`)
  if (!validVersion(b.minShell)) throw bad('bad bundle minShell')

  let shellDownloadUrl
  /** @type {{ size: number, sha256: string } | undefined} */
  let shellZip
  if (m.shell !== undefined) {
    if (!m.shell || typeof m.shell !== 'object') throw bad('shell must be an object')
    const s = /** @type {Record<string, unknown>} */ (m.shell)
    if (s.version !== undefined && !validVersion(s.version)) throw bad('bad shell version')
    if (s.dmgUrl !== undefined && !isHttpsUrl(s.dmgUrl)) throw bad('shell dmgUrl must be https')
    if (s.zipUrl !== undefined && !isHttpsUrl(s.zipUrl)) throw bad('shell zipUrl must be https')
    if (typeof s.dmgUrl === 'string') shellDownloadUrl = s.dmgUrl
    if (s.zipSha256 !== undefined || s.zipSize !== undefined) {
      if (typeof s.zipSha256 !== 'string' || !SHA256_RE.test(s.zipSha256)) throw bad('shell zipSha256 must be 64 hex characters')
      if (typeof s.zipSize !== 'number' || !Number.isSafeInteger(s.zipSize) || s.zipSize <= 0) throw bad('shell zipSize must be a positive integer')
      if (s.zipSize > MAX_SHELL_BYTES) throw bad(`shell zipSize ${s.zipSize} is over the ${MAX_SHELL_BYTES} byte limit`)
      shellZip = { size: s.zipSize, sha256: s.zipSha256.toLowerCase() }
    }
  }

  return {
    version,
    notes,
    publishedAt: m.publishedAt,
    size: b.size,
    sha256: b.sha256.toLowerCase(),
    minShell: /** @type {string} */ (b.minShell),
    bundleName: /** @type {string} */ (b.name),
    ...(shellDownloadUrl === undefined ? {} : { shellDownloadUrl }),
    ...(shellZip === undefined ? {} : { shellZip }),
  }
}

/** @param {unknown} value */
function isHttpsUrl(value) {
  if (typeof value !== 'string') return false
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Reads a response body as UTF-8 text, giving up as soon as it passes `limit`
 * bytes.
 * @param {Response} res
 * @param {number} limit
 * @returns {Promise<string | null>} the text, or null when the body was larger than `limit`
 */
async function readTextBounded(res, limit) {
  if (!res.body) return ''
  const reader = res.body.getReader()
  /** @type {Uint8Array[]} */
  const chunks = []
  let bytes = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    bytes += value.byteLength
    if (bytes > limit) {
      await reader.cancel().catch(() => {})
      return null
    }
    chunks.push(value)
  }
  return Buffer.concat(chunks).toString('utf8')
}

export class Updater extends EventEmitter {
  /** @type {ActiveBundle | null} */
  active = null
  /** @type {{ dir: string, version: string } | null} */
  builtIn = null

  /** @type {UpdateStatus} */
  #status = 'idle'
  /** @type {Latest | undefined} */
  #latest
  /** @type {{ received: number, total: number } | undefined} */
  #progress
  /** @type {string | undefined} */
  #error
  /** @type {boolean | undefined} */
  #needsToken
  /** @type {string | undefined} */
  #checkedAt
  #hasToken = false
  /** @type {unknown} release JSON from the last successful check() */
  #release = null
  /** @type {string | null} version extracted into bundles/ and waiting for apply() */
  #readyVersion = null
  /** @type {Promise<UpdateState> | null} */
  #checking = null
  /** @type {Promise<UpdateState> | null} */
  #downloading = null
  /** @type {ShellUpdateState | undefined} */
  #shell
  /** @type {string | null} the verified app waiting for installShell() */
  #shellApp = null
  /** @type {Promise<UpdateState> | null} */
  #shellDownloading = null
  /** @type {string | null} version written to current.json for the next launch */
  #stagedVersion = null

  /** @param {UpdaterOptions} opts */
  constructor(opts) {
    super()
    const o = opts ?? {}
    if (typeof o.repo !== 'string' || !REPO_RE.test(o.repo)) throw new TypeError(`Updater: invalid repo ${JSON.stringify(o.repo)}`)
    if (typeof o.userData !== 'string' || !o.userData) throw new TypeError('Updater: userData is required')
    if (typeof o.builtInDir !== 'string' || !o.builtInDir) throw new TypeError('Updater: builtInDir is required')
    if (!validVersion(o.shellVersion)) throw new TypeError(`Updater: invalid shellVersion ${JSON.stringify(o.shellVersion)}`)
    const apiBase = o.apiBase ?? 'https://api.github.com'
    let apiUrl
    try {
      apiUrl = new URL(apiBase)
    } catch {
      throw new TypeError(`Updater: invalid apiBase ${JSON.stringify(apiBase)}`)
    }
    if (apiUrl.protocol !== 'https:' && apiUrl.protocol !== 'http:') throw new TypeError(`Updater: apiBase must be http(s)`)
    if (typeof o.fetchImpl !== 'function' && typeof globalThis.fetch !== 'function') throw new TypeError('Updater: no fetch available')

    this.repo = o.repo
    this.apiBase = apiBase.replace(/\/+$/, '')
    // Plain http is only ever a test/dev override; assets then live there too.
    this.allowInsecure = apiUrl.protocol === 'http:'
    this.userData = o.userData
    this.builtInDir = o.builtInDir
    this.shellVersion = o.shellVersion
    this.fetchImpl = o.fetchImpl ?? globalThis.fetch
    this.getToken = o.getToken ?? (() => null)
    this.log = o.log ?? (() => {})
    this.shellInstaller = o.shellInstaller ?? null
    this.autoUpdate = o.autoUpdate === true
    this.paths = {
      bundles: path.join(o.userData, 'bundles'),
      tmp: path.join(o.userData, 'bundles', 'tmp'),
      current: path.join(o.userData, 'bundles', 'current.json'),
      bad: path.join(o.userData, 'bundles', 'bad.json'),
      shell: path.join(o.userData, 'shell-update'),
    }
  }

  /** @param {string} version */
  bundleDir(version) {
    return path.join(this.paths.bundles, version)
  }

  // ── boot ─────────────────────────────────────────────────────────────

  /**
   * Picks the bundle to serve (§3 of the contract), repairs current.json if
   * it points at something unusable, and garbage-collects the bundles dir.
   * Synchronous: main.js needs the answer before registering the protocol.
   * @returns {ActiveBundle}
   */
  resolveActive() {
    const builtInMeta = readJson(path.join(this.builtInDir, BUNDLE_META), this.log)
    const builtInVersion =
      validVersion(builtInMeta && typeof builtInMeta === 'object' ? /** @type {{ version?: unknown }} */ (builtInMeta).version : null) ??
      this.shellVersion
    this.builtIn = { dir: this.builtInDir, version: builtInVersion }

    let current = normalizeCurrent(readJson(this.paths.current, this.log))
    const bad = this.#readBad()
    /** @type {ActiveBundle | null} */
    let active = null
    if (current.version) {
      const reason = this.validateBundle(current.version, bad)
      if (reason === null) {
        active = { dir: this.bundleDir(current.version), version: current.version, builtIn: false }
      } else {
        this.log(`updater: bundle ${current.version} is unusable (${reason}); falling back to built-in`)
        current = { version: null, previous: null }
        try {
          writeJsonAtomic(this.paths.current, current)
        } catch (err) {
          this.log('updater: could not rewrite current.json', describe(err))
        }
      }
    }
    this.active = active ?? { dir: this.builtInDir, version: builtInVersion, builtIn: true }
    this.#gc(current)
    // An app download from an earlier session: installed by now, or abandoned.
    try {
      fs.rmSync(this.paths.shell, { recursive: true, force: true })
    } catch (err) {
      this.log('updater: could not remove', this.paths.shell, describe(err))
    }
    return this.active
  }

  /**
   * Why `bundles/<version>` cannot be served, or null when it can.
   * @param {string} version
   * @param {string[]} [bad] quarantined versions (read from disk when omitted)
   * @returns {string | null}
   */
  validateBundle(version, bad = this.#readBad()) {
    if (!this.builtIn) throw new Error('Updater: resolveActive() must run before validateBundle()')
    if (!validVersion(version)) return 'invalid version'
    if (bad.includes(version)) return 'quarantined'
    if (!semver.gt(version, this.builtIn.version)) return `not newer than built-in ${this.builtIn.version}`
    const dir = this.bundleDir(version)
    if (!isFile(path.join(dir, 'index.html'))) return 'index.html missing'
    const meta = readJson(path.join(dir, BUNDLE_META), this.log)
    if (!meta || typeof meta !== 'object') return `${BUNDLE_META} missing or unreadable`
    const { version: metaVersion, minShell } = /** @type {{ version?: unknown, minShell?: unknown }} */ (meta)
    if (metaVersion !== version) return `${BUNDLE_META} says ${JSON.stringify(metaVersion)}`
    if (!validVersion(minShell)) return `${BUNDLE_META} has no valid minShell`
    if (!semver.gte(this.shellVersion, /** @type {string} */ (minShell))) return `needs shell ${minShell}, have ${this.shellVersion}`
    return null
  }

  /** @param {CurrentFile} current */
  #gc(current) {
    const keep = new Set([current.version, current.previous].filter(Boolean))
    /** @type {fs.Dirent[]} */
    let dirents
    try {
      dirents = fs.readdirSync(this.paths.bundles, { withFileTypes: true })
    } catch (err) {
      if (/** @type {{ code?: string }} */ (err).code !== 'ENOENT') this.log('updater: cannot list bundles dir', describe(err))
      return
    }
    for (const d of dirents) {
      if (!d.isDirectory() || keep.has(d.name)) continue
      const full = path.join(this.paths.bundles, d.name)
      try {
        fs.rmSync(full, { recursive: true, force: true })
        this.log(`updater: removed ${d.name === 'tmp' ? 'stale downloads' : `unused bundle ${d.name}`}`)
      } catch (err) {
        this.log('updater: could not remove', full, describe(err))
      }
    }
  }

  /** @returns {string[]} */
  #readBad() {
    const raw = readJson(this.paths.bad, this.log)
    const versions = raw && typeof raw === 'object' ? /** @type {{ versions?: unknown }} */ (raw).versions : null
    if (!Array.isArray(versions)) return []
    return versions.filter((v) => validVersion(v) !== null)
  }

  /** @param {string[]} versions */
  #writeBad(versions) {
    writeJsonAtomic(this.paths.bad, { versions })
  }

  // ── state ────────────────────────────────────────────────────────────

  /** @returns {UpdateState} */
  getState() {
    if (!this.active || !this.builtIn) throw new Error('Updater: resolveActive() must run before getState()')
    /** @type {UpdateState} */
    const state = {
      status: this.#status,
      current: this.active.version,
      builtIn: this.builtIn.version,
      shell: this.shellVersion,
      repo: this.repo,
      hasToken: this.#hasToken,
      canRollback: !this.active.builtIn,
    }
    if (this.#checkedAt !== undefined) state.checkedAt = this.#checkedAt
    if (this.#latest !== undefined) state.latest = { ...this.#latest }
    if (this.#progress !== undefined) state.progress = { ...this.#progress }
    if (this.#error !== undefined) state.error = this.#error
    if (this.#needsToken !== undefined) state.needsToken = this.#needsToken
    if (this.#shell !== undefined) {
      state.shellUpdate = { ...this.#shell }
      if (this.#shell.progress) state.shellUpdate.progress = { ...this.#shell.progress }
    }
    // Always present (true or false) so the renderer can tell this shell from
    // one too old to update itself, which never sends it.
    state.autoUpdate = this.autoUpdate
    if (this.#stagedVersion !== null && this.#stagedVersion === this.#readyVersion) state.staged = true
    return state
  }

  #emit() {
    try {
      this.emit('state', this.getState())
    } catch (err) {
      this.log('updater: state listener threw', describe(err))
    }
  }

  /** @param {unknown} err */
  #fail(err) {
    this.#status = 'error'
    if (err instanceof UpdateError) {
      this.#error = err.message
      if (err.needsToken) this.#needsToken = true
    } else {
      this.#error = `Update failed: ${describe(err)}`
    }
    this.log('updater:', this.#error)
  }

  /**
   * Re-reads the token (after Settings saved or removed one) and updates
   * `hasToken`.
   * @returns {Promise<UpdateState>}
   */
  async refreshToken() {
    await this.#loadToken()
    this.#emit()
    return this.getState()
  }

  /** @returns {Promise<string | null>} */
  async #loadToken() {
    let token = null
    try {
      const value = await this.getToken()
      if (typeof value === 'string' && value.length > 0) token = value
    } catch (err) {
      this.log('updater: getToken failed', describe(err))
    }
    this.#hasToken = token !== null
    return token
  }

  // ── network ──────────────────────────────────────────────────────────

  /**
   * fetch with manual redirects: the Authorization header is dropped on
   * every hop because GitHub bounces asset downloads to a signed storage URL
   * that rejects it (and forwarding a bearer token to a new host is wrong
   * anyway).
   * @param {string} url
   * @param {{ accept: string, token: string | null }} opts
   * @returns {Promise<Response>}
   */
  async #request(url, { accept, token }) {
    /** @type {Record<string, string>} */
    const headers = {
      Accept: accept,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': `ORBIT-desktop/${this.shellVersion}`,
    }
    if (token) headers.Authorization = `Bearer ${token}`

    let target = this.#checkedUrl(url)
    for (let hop = 0; ; hop++) {
      let res
      try {
        res = await this.fetchImpl(target, { headers, redirect: 'manual' })
      } catch (err) {
        throw new UpdateError(`Could not reach ${new URL(target).host} (${describe(err)}).`, { cause: err })
      }
      if (!REDIRECT_STATUSES.has(res.status)) return res
      const location = res.headers.get('location')
      await res.body?.cancel().catch(() => {})
      if (!location) throw new UpdateError(`GitHub redirected without a Location header (HTTP ${res.status}).`)
      if (hop + 1 > MAX_REDIRECTS) throw new UpdateError('Too many redirects while downloading from GitHub.')
      target = this.#checkedUrl(new URL(location, target).href)
      delete headers.Authorization
    }
  }

  /**
   * @param {string} url absolute, or relative to apiBase
   * @returns {string}
   */
  #checkedUrl(url) {
    let parsed
    try {
      parsed = new URL(url, this.apiBase + '/')
    } catch {
      throw new UpdateError(`GitHub returned an invalid URL: ${JSON.stringify(url)}`)
    }
    if (parsed.protocol === 'https:' || (this.allowInsecure && parsed.protocol === 'http:')) return parsed.href
    throw new UpdateError(`Refusing to fetch a non-https URL: ${parsed.href}`)
  }

  /**
   * @param {string | null} token
   * @returns {Promise<Record<string, unknown>>}
   */
  async #fetchLatestRelease(token) {
    const res = await this.#request(`${this.apiBase}/repos/${this.repo}/releases/latest`, {
      accept: 'application/vnd.github+json',
      token,
    })
    if (res.status === 401) {
      await res.body?.cancel().catch(() => {})
      throw new UpdateError('GitHub rejected the access token.', { needsToken: true })
    }
    if (res.status === 404) {
      await res.body?.cancel().catch(() => {})
      throw token
        ? new UpdateError(`No release found for ${this.repo}.`)
        : new UpdateError('No release found. If the repository is private, add an access token below.', { needsToken: true })
    }
    if (res.status === 403 || res.status === 429) {
      await res.body?.cancel().catch(() => {})
      throw new UpdateError(`GitHub refused the request (HTTP ${res.status}). You may be rate-limited; try again later.`)
    }
    if (!res.ok) {
      await res.body?.cancel().catch(() => {})
      throw new UpdateError(`GitHub returned HTTP ${res.status} while checking for updates.`)
    }
    let json
    try {
      json = await res.json()
    } catch {
      throw new UpdateError('GitHub returned an unreadable release response.')
    }
    if (!json || typeof json !== 'object' || !Array.isArray(json.assets)) {
      throw new UpdateError('GitHub returned an unexpected release response.')
    }
    return json
  }

  /**
   * @param {{ name: string, url: string }} asset
   * @param {string | null} token
   */
  async #fetchManifest(asset, token) {
    const res = await this.#request(asset.url, { accept: 'application/octet-stream', token })
    if (!res.ok) {
      await res.body?.cancel().catch(() => {})
      throw new UpdateError(`Could not download ${MANIFEST_ASSET} (HTTP ${res.status}).`)
    }
    const tooLarge = () => new UpdateError(`${MANIFEST_ASSET} is unreasonably large.`)
    const length = Number(res.headers.get('content-length'))
    if (Number.isFinite(length) && length > MAX_MANIFEST_BYTES) {
      await res.body?.cancel().catch(() => {})
      throw tooLarge()
    }
    let text
    try {
      // Content-Length is optional, so the limit has to hold while reading:
      // res.text() would buffer a chunked body of any size first.
      text = await readTextBounded(res, MAX_MANIFEST_BYTES)
    } catch (err) {
      throw new UpdateError(`Could not read ${MANIFEST_ASSET} (${describe(err)}).`, { cause: err })
    }
    if (text === null) throw tooLarge()
    let json
    try {
      json = JSON.parse(text)
    } catch {
      throw new UpdateError(`${MANIFEST_ASSET} is not valid JSON.`)
    }
    return validateManifest(json)
  }

  // ── check ────────────────────────────────────────────────────────────

  /** @returns {Promise<UpdateState>} */
  check() {
    if (this.#checking) return this.#checking
    if (this.#downloading) return this.#downloading
    if (this.#shellDownloading) return this.#shellDownloading
    this.#checking = this.#check().finally(() => {
      this.#checking = null
    })
    return this.#checking
  }

  /** @returns {Promise<UpdateState>} */
  async #check() {
    if (!this.active) throw new Error('Updater: resolveActive() must run before check()')
    this.#status = 'checking'
    this.#error = undefined
    this.#needsToken = undefined
    this.#progress = undefined
    this.#emit()
    try {
      const token = await this.#loadToken()
      const release = await this.#fetchLatestRelease(token)
      const asset = findAsset(release, MANIFEST_ASSET)
      if (!asset) throw new UpdateError(`The latest release of ${this.repo} has no ${MANIFEST_ASSET} asset.`)
      const { bundleName, ...latest } = await this.#fetchManifest(asset, token)

      if (!semver.gt(latest.version, this.active.version)) {
        this.#latest = undefined
        this.#status = 'up-to-date'
      } else if (semver.gt(latest.minShell, this.shellVersion)) {
        this.#latest = latest
        this.#status = 'shell-required'
      } else if (this.#readyVersion === latest.version && this.validateBundle(latest.version) === null) {
        // Already downloaded and extracted earlier in this session; keep
        // offering the restart instead of downloading it again.
        this.#latest = latest
        this.#status = 'ready'
      } else {
        // Fail here rather than at download time so the card never offers
        // an update the release cannot actually deliver.
        if (!findAsset(release, bundleName)) throw new UpdateError(`The latest release has no ${bundleName} asset.`)
        this.#latest = latest
        this.#status = 'available'
      }
      this.#release = release
      this.#checkedAt = new Date().toISOString()
      // An app download for a release that is no longer the one to install.
      if (this.#shell && (this.#status !== 'shell-required' || this.#shell.version !== latest.version)) {
        this.#shell = undefined
        this.#shellApp = null
      }
    } catch (err) {
      this.#fail(err)
      // A bundle downloaded and verified earlier is still worth restarting
      // into when the check that would re-offer it fails (offline, rate
      // limit, a bad manifest upstream): otherwise apply() is refused until a
      // check succeeds, and the next boot's GC throws the download away. The
      // failure stays in `error` for the card to show beside "Restart now".
      if (this.#readyVersion && this.#latest?.version === this.#readyVersion && this.validateBundle(this.#readyVersion) === null) {
        this.#status = 'ready'
        this.log(`updater: keeping ${this.#readyVersion} ready to apply despite the failed check`)
      }
    }
    this.#emit()
    this.#continueAutomatically()
    return this.getState()
  }

  /**
   * What an ordinary app does after finding an update: fetch it, without
   * waiting to be asked. Runs in the background; the progress and the outcome
   * arrive through 'state' like any download the card started.
   */
  #continueAutomatically() {
    if (!this.autoUpdate) return
    if (this.#status === 'available') {
      this.download().catch((err) => this.log('updater: automatic download failed', describe(err)))
    } else if (this.#status === 'shell-required' && this.#shell?.status !== 'ready' && this.#shell?.status !== 'manual') {
      this.downloadShell().catch((err) => this.log('updater: automatic app download failed', describe(err)))
    }
  }

  // ── download ─────────────────────────────────────────────────────────

  /** @returns {Promise<UpdateState>} */
  download() {
    if (this.#downloading) return this.#downloading
    if (this.#status === 'ready') return Promise.resolve(this.getState())
    if (this.#status !== 'available' || !this.#latest) {
      return Promise.reject(new Error('No update is available to download; check for updates first.'))
    }
    this.#downloading = this.#download(this.#latest).finally(() => {
      this.#downloading = null
    })
    return this.#downloading
  }

  /**
   * @param {Latest} latest
   * @returns {Promise<UpdateState>}
   */
  async #download(latest) {
    const { version, size, sha256 } = latest
    const assetName = bundleAssetName(version)
    const zipPath = path.join(this.paths.tmp, `${version}.zip`)
    const extractDir = path.join(this.paths.tmp, version)

    this.#status = 'downloading'
    this.#error = undefined
    this.#progress = { received: 0, total: size }
    this.#emit()
    try {
      const asset = findAsset(this.#release, assetName)
      if (!asset) throw new UpdateError(`The latest release has no ${assetName} asset.`)

      await fs.promises.mkdir(this.paths.tmp, { recursive: true })
      await fs.promises.rm(zipPath, { force: true })
      await fs.promises.rm(extractDir, { recursive: true, force: true })

      const token = await this.#loadToken()
      const res = await this.#request(asset.url, { accept: 'application/octet-stream', token })
      if (!res.ok) {
        await res.body?.cancel().catch(() => {})
        throw new UpdateError(`Could not download ${assetName} (HTTP ${res.status}).`)
      }
      if (!res.body) throw new UpdateError(`GitHub returned an empty response for ${assetName}.`)

      const received = await this.#streamToFile(res.body, zipPath, size)
      this.#progress = { received: received.bytes, total: size }
      if (received.bytes !== size) {
        throw new UpdateError(`Downloaded ${received.bytes} bytes but the manifest says ${size}.`)
      }
      if (received.sha256 !== sha256) {
        throw new UpdateError('The downloaded bundle failed its integrity check (SHA-256 mismatch).')
      }

      const zipBuffer = await fs.promises.readFile(zipPath)
      try {
        await extractZip(zipBuffer, extractDir)
      } catch (err) {
        if (err instanceof ZipError) throw new UpdateError(`The downloaded bundle could not be unpacked (${err.message}).`, { cause: err })
        throw err
      }
      this.#verifyExtracted(extractDir, version)

      const finalDir = this.bundleDir(version)
      await fs.promises.rm(finalDir, { recursive: true, force: true })
      await fs.promises.rename(extractDir, finalDir)
      await fs.promises.rm(zipPath, { force: true })

      const bad = this.#readBad()
      if (bad.includes(version)) this.#writeBad(bad.filter((v) => v !== version))

      this.#readyVersion = version
      this.#progress = undefined
      this.#status = 'ready'
      if (this.autoUpdate) this.#stage(version)
    } catch (err) {
      await fs.promises.rm(zipPath, { force: true }).catch(() => {})
      await fs.promises.rm(extractDir, { recursive: true, force: true }).catch(() => {})
      this.#progress = undefined
      this.#fail(err)
    }
    this.#emit()
    return this.getState()
  }

  /**
   * Streams the body to disk while hashing, emitting progress at most every
   * PROGRESS_INTERVAL_MS. Aborts as soon as the body exceeds `limit`.
   * @param {ReadableStream<Uint8Array>} body
   * @param {string} file
   * @param {number} limit
   * @param {(received: number) => void} [onProgress] instead of the bundle download's progress
   * @returns {Promise<{ bytes: number, sha256: string }>}
   */
  async #streamToFile(body, file, limit, onProgress) {
    const hash = createHash('sha256')
    const reader = body.getReader()
    const handle = await fs.promises.open(file, 'w')
    let bytes = 0
    let lastEmit = 0
    try {
      for (;;) {
        let chunk
        try {
          chunk = await reader.read()
        } catch (err) {
          throw new UpdateError(`The download was interrupted (${describe(err)}).`, { cause: err })
        }
        if (chunk.done) break
        bytes += chunk.value.byteLength
        if (bytes > limit) {
          await reader.cancel().catch(() => {})
          throw new UpdateError(`The download is larger than the ${limit} bytes the manifest promised.`)
        }
        hash.update(chunk.value)
        await handle.write(chunk.value)
        const now = Date.now()
        if (now - lastEmit >= PROGRESS_INTERVAL_MS) {
          lastEmit = now
          if (onProgress) onProgress(bytes)
          else this.#progress = { received: bytes, total: limit }
          this.#emit()
        }
      }
    } finally {
      await handle.close()
    }
    return { bytes, sha256: hash.digest('hex') }
  }

  /**
   * @param {string} dir
   * @param {string} version
   */
  #verifyExtracted(dir, version) {
    if (!isFile(path.join(dir, 'index.html'))) throw new UpdateError('The downloaded bundle has no index.html.')
    const meta = readJson(path.join(dir, BUNDLE_META), this.log)
    if (!meta || typeof meta !== 'object') throw new UpdateError(`The downloaded bundle has no readable ${BUNDLE_META}.`)
    const { version: metaVersion, minShell } = /** @type {{ version?: unknown, minShell?: unknown }} */ (meta)
    if (metaVersion !== version) {
      throw new UpdateError(`The downloaded bundle reports version ${JSON.stringify(metaVersion)}, not ${version}.`)
    }
    if (!validVersion(minShell)) throw new UpdateError(`The downloaded bundle has no valid minShell in ${BUNDLE_META}.`)
    if (!semver.gte(this.shellVersion, /** @type {string} */ (minShell))) {
      throw new UpdateError(`The downloaded bundle needs ORBIT ${minShell} or newer.`)
    }
  }

  // ── updating the app itself ──────────────────────────────────────────

  /**
   * Downloads the latest release's app, verifies it, and unpacks it, ready
   * for installShell(). Only when the latest bundle needs a newer app than
   * this one; when this copy cannot replace itself, reports 'manual' with the
   * reason, and the card offers the download page instead.
   * @returns {Promise<UpdateState>}
   */
  downloadShell() {
    if (this.#shellDownloading) return this.#shellDownloading
    if (this.#shell?.status === 'ready' && this.#shellApp) return Promise.resolve(this.getState())
    if (this.#status !== 'shell-required' || !this.#latest) {
      return Promise.reject(new Error('No app update is needed; check for updates first.'))
    }
    this.#shellDownloading = this.#downloadShell(this.#latest).finally(() => {
      this.#shellDownloading = null
    })
    return this.#shellDownloading
  }

  /**
   * @param {Latest} latest
   * @returns {Promise<UpdateState>}
   */
  async #downloadShell(latest) {
    const { version } = latest
    const installer = this.shellInstaller
    const support = installer ? installer.supported() : { ok: false, reason: 'This copy of ORBIT cannot update itself.' }
    if (!installer || !support.ok) {
      this.#shell = { status: 'manual', version, error: /** @type {{ reason: string }} */ (support).reason }
      this.log('updater: app update must be done by hand:', this.#shell.error)
      this.#emit()
      return this.getState()
    }
    const assetName = shellAssetName(version)
    const work = path.join(this.paths.shell, version)
    const zipPath = path.join(this.paths.shell, `${version}.zip`)
    const limit = latest.shellZip?.size ?? MAX_SHELL_BYTES
    this.#shellApp = null
    this.#shell = { status: 'downloading', version, progress: { received: 0, total: latest.shellZip?.size ?? 0 } }
    this.#emit()
    try {
      const asset = findAsset(this.#release, assetName)
      if (!asset) throw new UpdateError(`The latest release has no ${assetName} asset.`)
      const total = latest.shellZip?.size ?? asset.size ?? 0
      if (total > MAX_SHELL_BYTES) throw new UpdateError(`${assetName} is larger than the ${MAX_SHELL_BYTES} bytes an app may be.`)
      this.#shell.progress = { received: 0, total }

      await fs.promises.rm(this.paths.shell, { recursive: true, force: true })
      await fs.promises.mkdir(this.paths.shell, { recursive: true })

      const token = await this.#loadToken()
      const res = await this.#request(asset.url, { accept: 'application/octet-stream', token })
      if (!res.ok) {
        await res.body?.cancel().catch(() => {})
        throw new UpdateError(`Could not download ${assetName} (HTTP ${res.status}).`)
      }
      if (!res.body) throw new UpdateError(`GitHub returned an empty response for ${assetName}.`)

      const received = await this.#streamToFile(res.body, zipPath, total || limit, (p) => {
        if (this.#shell) this.#shell.progress = { received: p, total }
      })
      if (latest.shellZip) {
        if (received.bytes !== latest.shellZip.size) throw new UpdateError(`Downloaded ${received.bytes} bytes of the app but the manifest says ${latest.shellZip.size}.`)
        if (received.sha256 !== latest.shellZip.sha256) throw new UpdateError('The downloaded app failed its integrity check (SHA-256 mismatch).')
      } else if (asset.size !== null && received.bytes !== asset.size) {
        throw new UpdateError(`Downloaded ${received.bytes} bytes of the app but GitHub says ${asset.size}.`)
      }

      await fs.promises.mkdir(work, { recursive: true })
      try {
        await installer.extract(zipPath, work)
      } catch (err) {
        throw new UpdateError(`The downloaded app could not be unpacked (${describe(err)}).`, { cause: err })
      }
      await fs.promises.rm(zipPath, { force: true })
      const app = installer.findApp(work)
      if (!app) throw new UpdateError('The downloaded zip has no ORBIT app in it.')
      try {
        await installer.verify(app, version)
      } catch (err) {
        throw new UpdateError(`The downloaded app did not pass its checks (${describe(err)}).`, { cause: err })
      }
      this.#shellApp = app
      this.#shell = { status: 'ready', version }
      this.log(`updater: app ${version} downloaded and verified at ${app}`)
    } catch (err) {
      await fs.promises.rm(this.paths.shell, { recursive: true, force: true }).catch(() => {})
      const message = err instanceof UpdateError ? err.message : `Updating the app failed: ${describe(err)}`
      this.#shell = { status: 'error', version, error: message }
      this.log('updater:', message)
    }
    this.#emit()
    return this.getState()
  }

  /**
   * Hands the verified app to the installer, which replaces this one as soon
   * as it has quit and then opens the new one, and asks the shell to quit.
   * Learner data is in userData, outside the app, so nothing is lost.
   */
  async installShell() {
    if (this.#shell?.status !== 'ready' || !this.#shellApp || !this.shellInstaller) {
      throw new Error('No downloaded app is ready to install.')
    }
    const { version } = this.#shell
    this.shellInstaller.install(this.#shellApp, this.paths.shell)
    this.log(`updater: installing app ${version}; quitting so it can be swapped in`)
    this.emit('quit', { reason: 'shell', version })
  }

  /**
   * Whether a verified app is waiting to be swapped in. main.js asks when
   * ORBIT is quitting, and installOnExit() does the swap.
   * @returns {boolean}
   */
  hasAppReady() {
    return this.#shell?.status === 'ready' && this.#shellApp !== null && this.shellInstaller !== null
  }

  /**
   * Swaps the downloaded app in once this process has exited, without opening
   * it: the quit was the user's, so the new version is simply there next time.
   * Returns whether an install was started.
   * @returns {boolean}
   */
  installOnExit() {
    if (!this.autoUpdate || !this.hasAppReady()) return false
    const { version } = /** @type {ShellUpdateState} */ (this.#shell)
    try {
      /** @type {ShellInstaller} */ (this.shellInstaller).install(/** @type {string} */ (this.#shellApp), this.paths.shell, { reopen: false })
    } catch (err) {
      this.log('updater: could not start installing the app on quit', describe(err))
      return false
    }
    this.log(`updater: ORBIT is quitting; app ${version} will be swapped in`)
    return true
  }

  // ── switching bundles ────────────────────────────────────────────────

  /**
   * Points current.json at a verified download so the next launch opens it,
   * keeping the running bundle as `previous` for the boot watchdog to fall
   * back to. The running session is untouched: resolveActive() only reads
   * current.json at boot.
   * @param {string} version
   */
  #stage(version) {
    if (!this.active) return
    const reason = this.validateBundle(version)
    if (reason !== null) {
      this.log(`updater: not staging ${version} (${reason})`)
      return
    }
    try {
      writeJsonAtomic(this.paths.current, { version, previous: this.active.version })
      this.#stagedVersion = version
      this.log(`updater: ${version} opens on the next launch`)
    } catch (err) {
      this.log('updater: could not stage', version, describe(err))
    }
  }

  /**
   * Points current.json at the downloaded bundle and asks the shell to
   * relaunch. The switch itself happens in the next resolveActive().
   */
  async apply() {
    if (!this.active) throw new Error('Updater: resolveActive() must run before apply()')
    if (this.#status !== 'ready' || !this.#readyVersion) throw new Error('No downloaded update is ready to apply.')
    const version = this.#readyVersion
    const reason = this.validateBundle(version)
    if (reason !== null) {
      this.#readyVersion = null
      this.#fail(new UpdateError(`The downloaded update can no longer be used (${reason}). Check for updates again.`))
      this.#emit()
      throw new Error(/** @type {string} */ (this.#error))
    }
    writeJsonAtomic(this.paths.current, { version, previous: this.active.version })
    this.log(`updater: switching to ${version} on relaunch`)
    this.emit('relaunch', { reason: 'apply', version })
  }

  /**
   * Returns to the built-in bundle on relaunch. The downloaded bundle stays
   * on disk until the next boot's GC so a crash mid-way loses nothing.
   */
  async rollback() {
    if (!this.active) throw new Error('Updater: resolveActive() must run before rollback()')
    if (this.active.builtIn) throw new Error('The built-in version is already active.')
    writeJsonAtomic(this.paths.current, { version: null, previous: null })
    this.#stagedVersion = null
    this.log(`updater: rolling back from ${this.active.version} to built-in on relaunch`)
    this.emit('relaunch', { reason: 'rollback', version: this.active.version })
  }

  /**
   * Marks a bundle as broken (the boot watchdog calls this when a downloaded
   * bundle never reports ready) and moves current.json to `previous`, or to
   * the built-in bundle when there is no usable previous.
   * @param {string} version
   */
  quarantine(version) {
    if (!validVersion(version)) throw new TypeError(`Updater: invalid version ${JSON.stringify(version)}`)
    // The two writes are independent: either one alone keeps the next boot
    // off this bundle (resolveActive() refuses a quarantined version even when
    // current.json still names it), so one failing must not skip the other.
    /** @type {unknown[]} */
    const failures = []
    const bad = this.#readBad()
    let blacklisted = bad.includes(version)
    if (!blacklisted) {
      try {
        this.#writeBad([...bad, version])
        blacklisted = true
      } catch (err) {
        failures.push(err)
      }
    }

    const current = normalizeCurrent(readJson(this.paths.current, this.log))
    let selected = current.version === version
    if (selected) {
      const previous = current.previous
      const next = previous && previous !== version && !bad.includes(previous) ? previous : null
      try {
        writeJsonAtomic(this.paths.current, { version: next, previous: null })
        selected = false
      } catch (err) {
        failures.push(err)
      }
    }
    if (this.#readyVersion === version) {
      this.#readyVersion = null
      if (this.#status === 'ready') this.#status = 'idle'
    }
    if (this.#stagedVersion === version) this.#stagedVersion = null
    if (selected && !blacklisted) {
      // Nothing on disk changed: a relaunch would serve this bundle again.
      throw new UpdateError(`Could not quarantine ${version} (${failures.map(describe).join('; ')}).`, { cause: failures[0] })
    }
    for (const err of failures) this.log(`updater: quarantined ${version} but a write failed`, describe(err))
    this.log(`updater: quarantined ${version}`)
  }
}

/** @param {string} file */
function isFile(file) {
  try {
    return fs.statSync(file).isFile()
  } catch {
    return false
  }
}
