/* ============================================================================
   Updater tests
   ----------------------------------------------------------------------------
   Everything runs against real files and a real HTTP server: a built-in
   bundle directory, a userData directory, zip fixtures made by the zip CLI
   and Python, and FakeGitHub standing in for api.github.com plus the storage
   redirect. Nothing is mocked.
   ========================================================================== */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { MAX_BUNDLE_BYTES, MAX_MANIFEST_BYTES, Updater, type UpdateState } from '../updater.js'
import { findAppIn } from '../shellInstall.js'
import {
  FakeGitHub,
  REPO,
  type FakeGitHubOptions,
  makeManifest,
  makeTempDir,
  removeDir,
  sha256,
  writeBundleTree,
  zipEntriesWithPython,
  zipWithCli,
  zipWithPython,
} from './fixtures.ts'

const SHELL = '1.0.0'
const BUILT_IN = '1.0.0'
const NEW = '9.9.9'
const TOKEN = 'ghp_' + 'a'.repeat(36)

let fixtures: string
let builtInDir: string
let bundleZip: Buffer
let userData: string
const servers: FakeGitHub[] = []

beforeAll(() => {
  fixtures = makeTempDir('updater-fixtures')
  builtInDir = path.join(fixtures, 'dist')
  writeBundleTree(builtInDir, { version: BUILT_IN, minShell: '1.0.0' })
  const tree = path.join(fixtures, `bundle-${NEW}`)
  writeBundleTree(tree, { version: NEW, minShell: '1.0.0' })
  bundleZip = zipWithCli(tree, path.join(fixtures, `orbit-bundle-${NEW}.zip`))
})

afterAll(() => removeDir(fixtures))

beforeEach(() => {
  userData = makeTempDir('updater-userdata')
})

afterEach(async () => {
  await Promise.all(servers.splice(0).map((s) => s.stop()))
  removeDir(userData)
})

// ── helpers ────────────────────────────────────────────────────────────

const bundlesDir = () => path.join(userData, 'bundles')
const readCurrent = () => JSON.parse(readFileSync(path.join(bundlesDir(), 'current.json'), 'utf8'))
const readBad = () => JSON.parse(readFileSync(path.join(bundlesDir(), 'bad.json'), 'utf8'))
const writeCurrent = (value: unknown) => {
  mkdirSync(bundlesDir(), { recursive: true })
  writeFileSync(path.join(bundlesDir(), 'current.json'), JSON.stringify(value))
}
const writeBad = (versions: string[]) => {
  mkdirSync(bundlesDir(), { recursive: true })
  writeFileSync(path.join(bundlesDir(), 'bad.json'), JSON.stringify({ versions }))
}

/** Installs a downloaded-looking bundle directly under userData. */
function installBundle(version: string, meta: Partial<{ version: string; minShell: string }> = {}): string {
  const dir = path.join(bundlesDir(), version)
  writeBundleTree(dir, { version, minShell: '1.0.0', ...meta })
  return dir
}

interface Harness {
  updater: Updater
  states: UpdateState[]
  relaunches: Array<{ reason: string; version?: string }>
  logs: string[]
}

function makeUpdater(opts: { apiBase?: string; token?: string | null; shellVersion?: string; resolve?: boolean } = {}): Harness {
  const logs: string[] = []
  const updater = new Updater({
    repo: REPO,
    apiBase: opts.apiBase ?? 'http://127.0.0.1:9',
    userData,
    builtInDir,
    shellVersion: opts.shellVersion ?? SHELL,
    getToken: async () => opts.token ?? null,
    log: (...args: unknown[]) => logs.push(args.map(String).join(' ')),
  })
  const states: UpdateState[] = []
  const relaunches: Harness['relaunches'] = []
  updater.on('state', (s: UpdateState) => states.push(s))
  updater.on('relaunch', (r: { reason: string; version?: string }) => relaunches.push(r))
  if (opts.resolve !== false) updater.resolveActive()
  return { updater, states, relaunches, logs }
}

async function startGitHub(opts: FakeGitHubOptions & { manifest?: Record<string, unknown> | null; bundle?: Buffer | null; port?: number } = {}) {
  const gh = new FakeGitHub(opts)
  servers.push(gh)
  await gh.start(opts.port)
  if (opts.manifest !== null) gh.addAsset('orbit-manifest.json', JSON.stringify(opts.manifest ?? makeManifest(NEW, bundleZip)))
  if (opts.bundle !== null) gh.addAsset(`orbit-bundle-${NEW}.zip`, opts.bundle ?? bundleZip)
  return gh
}

// ── constructor ────────────────────────────────────────────────────────

describe('Updater constructor', () => {
  it('validates its options', () => {
    const base = { repo: REPO, userData, builtInDir, shellVersion: SHELL }
    expect(() => new Updater({ ...base, repo: 'not a repo' })).toThrow(/repo/)
    expect(() => new Updater({ ...base, shellVersion: 'v1' })).toThrow(/shellVersion/)
    expect(() => new Updater({ ...base, apiBase: 'ftp://x' })).toThrow(/apiBase/)
    expect(() => new Updater({ ...base, userData: '' })).toThrow(/userData/)
    expect(new Updater(base).apiBase).toBe('https://api.github.com')
    expect(new Updater({ ...base, apiBase: 'https://ghe.example/api/v3/' }).apiBase).toBe('https://ghe.example/api/v3')
  })

  it('refuses to report state before resolveActive()', () => {
    const { updater } = makeUpdater({ resolve: false })
    expect(() => updater.getState()).toThrow(/resolveActive/)
    expect(updater.check()).rejects.toThrow(/resolveActive/)
  })
})

// ── resolveActive ──────────────────────────────────────────────────────

describe('resolveActive', () => {
  it('uses the built-in bundle when nothing is downloaded', () => {
    const { updater } = makeUpdater()
    expect(updater.active).toEqual({ dir: builtInDir, version: BUILT_IN, builtIn: true })
    expect(updater.builtIn).toEqual({ dir: builtInDir, version: BUILT_IN })
    const state = updater.getState()
    expect(state).toMatchObject({ status: 'idle', current: BUILT_IN, builtIn: BUILT_IN, shell: SHELL, repo: REPO, hasToken: false, canRollback: false })
    expect(state.latest).toBeUndefined()
    expect(existsSync(path.join(bundlesDir(), 'current.json'))).toBe(false)
  })

  it('falls back to the shell version when the built-in dir has no orbit-bundle.json', () => {
    const bare = path.join(fixtures, 'bare-dist')
    mkdirSync(bare, { recursive: true })
    writeFileSync(path.join(bare, 'index.html'), '<!doctype html>')
    const updater = new Updater({ repo: REPO, userData, builtInDir: bare, shellVersion: '1.4.2' })
    expect(updater.resolveActive()).toEqual({ dir: bare, version: '1.4.2', builtIn: true })
  })

  it('serves a valid downloaded bundle', () => {
    const dir = installBundle(NEW)
    writeCurrent({ version: NEW, previous: BUILT_IN })
    const { updater } = makeUpdater()
    expect(updater.active).toEqual({ dir, version: NEW, builtIn: false })
    expect(updater.getState()).toMatchObject({ current: NEW, builtIn: BUILT_IN, canRollback: true })
    expect(readCurrent()).toEqual({ version: NEW, previous: BUILT_IN })
    expect(existsSync(dir)).toBe(true)
  })

  it.each<[string, () => void]>([
    ['the directory is missing', () => {}],
    ['index.html is missing', () => rmSync(path.join(bundlesDir(), NEW, 'index.html'))],
    ['orbit-bundle.json is missing', () => rmSync(path.join(bundlesDir(), NEW, 'orbit-bundle.json'))],
    ['orbit-bundle.json is corrupt', () => writeFileSync(path.join(bundlesDir(), NEW, 'orbit-bundle.json'), '{')],
    ['orbit-bundle.json reports another version', () => installBundle(NEW, { version: '9.9.8' })],
    ['minShell is newer than the shell', () => installBundle(NEW, { minShell: '2.0.0' })],
    ['minShell is missing', () => writeFileSync(path.join(bundlesDir(), NEW, 'orbit-bundle.json'), JSON.stringify({ version: NEW }))],
    ['the version is quarantined', () => writeBad([NEW])],
  ])('falls back to built-in and resets current.json when %s', (label, sabotage) => {
    if (!label.startsWith('the directory')) installBundle(NEW)
    sabotage()
    writeCurrent({ version: NEW, previous: BUILT_IN })
    const { updater, logs } = makeUpdater()
    expect(updater.active).toEqual({ dir: builtInDir, version: BUILT_IN, builtIn: true })
    expect(readCurrent()).toEqual({ version: null, previous: null })
    expect(logs.some((l) => l.includes('unusable'))).toBe(true)
  })

  it('never serves a downloaded bundle that is not newer than the built-in one', () => {
    installBundle('0.9.0')
    writeCurrent({ version: '0.9.0', previous: null })
    expect(makeUpdater().updater.active?.builtIn).toBe(true)
    installBundle(BUILT_IN)
    writeCurrent({ version: BUILT_IN, previous: null })
    expect(makeUpdater().updater.active?.builtIn).toBe(true)
  })

  it('treats an unreadable current.json as empty', () => {
    installBundle(NEW)
    writeFileSync(path.join(bundlesDir(), 'current.json'), 'not json')
    const { updater } = makeUpdater()
    expect(updater.active?.builtIn).toBe(true)
    writeFileSync(path.join(bundlesDir(), 'current.json'), JSON.stringify({ version: 42, previous: ['x'] }))
    expect(makeUpdater().updater.active?.builtIn).toBe(true)
  })

  it('garbage-collects bundles that are neither current nor previous and wipes tmp', () => {
    installBundle('9.9.7')
    installBundle('9.9.8')
    installBundle(NEW)
    mkdirSync(path.join(bundlesDir(), 'tmp', 'partial'), { recursive: true })
    writeFileSync(path.join(bundlesDir(), 'tmp', 'partial', 'x.zip'), 'junk')
    writeFileSync(path.join(bundlesDir(), 'tmp', `${NEW}.zip`), 'junk')
    writeFileSync(path.join(bundlesDir(), 'notes.txt'), 'a stray file is left alone')
    writeBad(['9.9.7'])
    writeCurrent({ version: NEW, previous: '9.9.8' })

    const { updater } = makeUpdater()
    expect(updater.active?.version).toBe(NEW)
    expect(existsSync(path.join(bundlesDir(), NEW))).toBe(true)
    expect(existsSync(path.join(bundlesDir(), '9.9.8'))).toBe(true)
    expect(existsSync(path.join(bundlesDir(), '9.9.7'))).toBe(false)
    expect(existsSync(path.join(bundlesDir(), 'tmp'))).toBe(false)
    expect(existsSync(path.join(bundlesDir(), 'notes.txt'))).toBe(true)
    expect(existsSync(path.join(bundlesDir(), 'bad.json'))).toBe(true)
    expect(readBad()).toEqual({ versions: ['9.9.7'] })
  })

  it('garbage-collects everything after current.json was reset', () => {
    installBundle(NEW)
    installBundle('9.9.8')
    writeBad([NEW])
    writeCurrent({ version: NEW, previous: '9.9.8' })
    makeUpdater()
    expect(existsSync(path.join(bundlesDir(), NEW))).toBe(false)
    expect(existsSync(path.join(bundlesDir(), '9.9.8'))).toBe(false)
    expect(readCurrent()).toEqual({ version: null, previous: null })
  })

  it('validateBundle explains why a bundle is unusable', () => {
    const { updater } = makeUpdater()
    expect(updater.validateBundle(NEW)).toMatch(/index.html missing/)
    installBundle(NEW)
    expect(updater.validateBundle(NEW)).toBeNull()
    expect(updater.validateBundle('0.1.0')).toMatch(/not newer/)
    expect(updater.validateBundle('nope')).toMatch(/invalid version/)
    expect(updater.validateBundle(NEW, [NEW])).toBe('quarantined')
  })
})

// ── quarantine ─────────────────────────────────────────────────────────

describe('quarantine', () => {
  it('records the version and moves current.json to previous', () => {
    installBundle('9.9.8')
    installBundle(NEW)
    writeCurrent({ version: NEW, previous: '9.9.8' })
    const { updater } = makeUpdater()
    expect(updater.active?.version).toBe(NEW)

    updater.quarantine(NEW)
    expect(readBad()).toEqual({ versions: [NEW] })
    expect(readCurrent()).toEqual({ version: '9.9.8', previous: null })

    // Idempotent, and a relaunch lands on the previous bundle.
    updater.quarantine(NEW)
    expect(readBad()).toEqual({ versions: [NEW] })
    const next = makeUpdater()
    expect(next.updater.active).toMatchObject({ version: '9.9.8', builtIn: false })
    expect(existsSync(path.join(bundlesDir(), NEW))).toBe(false)
  })

  it('moves to the built-in bundle when previous is unusable or absent', () => {
    installBundle(NEW)
    writeCurrent({ version: NEW, previous: BUILT_IN })
    const { updater } = makeUpdater()
    updater.quarantine(NEW)
    expect(readCurrent()).toEqual({ version: BUILT_IN, previous: null })
    expect(makeUpdater().updater.active?.builtIn).toBe(true)
    expect(readCurrent()).toEqual({ version: null, previous: null })

    installBundle(NEW)
    writeCurrent({ version: NEW, previous: null })
    makeUpdater().updater.quarantine(NEW)
    expect(readCurrent()).toEqual({ version: null, previous: null })
  })

  it('skips a previous that is itself quarantined', () => {
    installBundle('9.9.8')
    installBundle(NEW)
    writeBad(['9.9.8'])
    writeCurrent({ version: NEW, previous: '9.9.8' })
    const { updater } = makeUpdater()
    updater.quarantine(NEW)
    expect(readBad().versions.sort()).toEqual(['9.9.8', NEW])
    expect(readCurrent()).toEqual({ version: null, previous: null })
  })

  it('only touches bad.json when the version is not the current one', () => {
    installBundle(NEW)
    writeCurrent({ version: NEW, previous: null })
    const { updater } = makeUpdater()
    updater.quarantine('9.9.8')
    expect(readBad()).toEqual({ versions: ['9.9.8'] })
    expect(readCurrent()).toEqual({ version: NEW, previous: null })
    expect(() => updater.quarantine('latest')).toThrow(TypeError)
  })

  // A directory sitting where writeJsonAtomic() wants its temp file makes the
  // write throw (EISDIR) — the same shape as a full or read-only bundles/ dir,
  // without needing a non-root user. Created after resolveActive(), whose GC
  // would otherwise sweep the stray directories away.
  const blockWrite = (name: string) => mkdirSync(path.join(bundlesDir(), `${name}.${process.pid}.tmp`))

  it('throws, leaving current.json untouched, when neither bad.json nor current.json can be written', () => {
    installBundle(NEW)
    writeCurrent({ version: NEW, previous: null })
    const { updater } = makeUpdater()
    expect(updater.active?.version).toBe(NEW)
    blockWrite('bad.json')
    blockWrite('current.json')
    expect(() => updater.quarantine(NEW)).toThrow(/Could not quarantine 9\.9\.9/)
    expect(readCurrent()).toEqual({ version: NEW, previous: null })
    expect(existsSync(path.join(bundlesDir(), 'bad.json'))).toBe(false)
  })

  it('still switches current.json away when only bad.json cannot be written', () => {
    installBundle(NEW)
    writeCurrent({ version: NEW, previous: null })
    const { updater, logs } = makeUpdater()
    blockWrite('bad.json')
    expect(() => updater.quarantine(NEW)).not.toThrow()
    expect(readCurrent()).toEqual({ version: null, previous: null })
    expect(existsSync(path.join(bundlesDir(), 'bad.json'))).toBe(false)
    expect(logs.some((l) => l.includes('a write failed'))).toBe(true)
    expect(makeUpdater().updater.active?.builtIn).toBe(true)
  })

  it('still blacklists the version when only current.json cannot be written', () => {
    installBundle(NEW)
    writeCurrent({ version: NEW, previous: null })
    const { updater } = makeUpdater()
    blockWrite('current.json')
    expect(() => updater.quarantine(NEW)).not.toThrow()
    expect(readBad()).toEqual({ versions: [NEW] })
    expect(readCurrent()).toEqual({ version: NEW, previous: null })
    // The next boot refuses the quarantined bundle even though current.json still names it.
    const next = makeUpdater()
    expect(next.updater.active?.builtIn).toBe(true)
    expect(next.logs.some((l) => l.includes('quarantined'))).toBe(true)
  })
})

// ── check ──────────────────────────────────────────────────────────────

describe('check', () => {
  it('reports an available update and sends the right headers', async () => {
    const gh = await startGitHub()
    const { updater, states } = makeUpdater({ apiBase: gh.apiBase })
    const state = await updater.check()

    expect(state.status).toBe('available')
    expect(state.latest).toEqual({
      version: NEW,
      notes: `Release v${NEW}`,
      publishedAt: '2026-09-22T00:00:00Z',
      size: bundleZip.length,
      sha256: sha256(bundleZip),
      minShell: '1.0.0',
      shellDownloadUrl: `https://github.com/${REPO}/releases/download/v${NEW}/ORBIT-${NEW}-universal.dmg`,
    })
    expect(state.error).toBeUndefined()
    expect(state.needsToken).toBeUndefined()
    expect(Number.isFinite(Date.parse(state.checkedAt!))).toBe(true)
    expect(states.map((s) => s.status)).toEqual(['checking', 'available'])

    const [api] = gh.requests(`/repos/${REPO}/releases/latest`)
    expect(api.headers.accept).toBe('application/vnd.github+json')
    expect(api.headers['x-github-api-version']).toBe('2022-11-28')
    expect(api.headers['user-agent']).toBe(`ORBIT-desktop/${SHELL}`)
    expect(api.headers.authorization).toBeUndefined()
    const [asset] = gh.requests('/assets/')
    expect(asset.headers.accept).toBe('application/octet-stream')
    expect(asset.headers['user-agent']).toBe(`ORBIT-desktop/${SHELL}`)
    expect(gh.requests('/files/orbit-manifest.json')).toHaveLength(1)
  })

  it('sends the token to GitHub but strips it after the redirect', async () => {
    const gh = await startGitHub({ hops: 3, requireToken: TOKEN })
    const { updater } = makeUpdater({ apiBase: gh.apiBase, token: TOKEN })
    const state = await updater.check()
    expect(state.status).toBe('available')
    expect(state.hasToken).toBe(true)

    expect(gh.requests(`/repos/`)[0].headers.authorization).toBe(`Bearer ${TOKEN}`)
    expect(gh.requests('/assets/')[0].headers.authorization).toBe(`Bearer ${TOKEN}`)
    const afterRedirect = [...gh.requests('/hop/'), ...gh.requests('/files/')]
    expect(afterRedirect).toHaveLength(3)
    for (const r of afterRedirect) expect(r.headers.authorization, r.path).toBeUndefined()
  })

  it('gives up after five redirects', async () => {
    const gh = await startGitHub({ hops: 7 })
    const { updater } = makeUpdater({ apiBase: gh.apiBase })
    const state = await updater.check()
    expect(state.status).toBe('error')
    expect(state.error).toMatch(/Too many redirects/)
    expect(gh.requests('/files/')).toHaveLength(0)
  })

  it('is up to date when the manifest version is not newer than the active bundle', async () => {
    const gh = await startGitHub({ manifest: makeManifest(BUILT_IN, bundleZip) })
    const { updater, states } = makeUpdater({ apiBase: gh.apiBase })
    const state = await updater.check()
    expect(state.status).toBe('up-to-date')
    expect(state.latest).toBeUndefined()
    expect(state.checkedAt).toBeDefined()
    expect(states.map((s) => s.status)).toEqual(['checking', 'up-to-date'])
  })

  it('compares against the downloaded bundle when one is active', async () => {
    installBundle(NEW)
    writeCurrent({ version: NEW, previous: null })
    const gh = await startGitHub()
    const { updater } = makeUpdater({ apiBase: gh.apiBase })
    expect(updater.active?.version).toBe(NEW)
    expect((await updater.check()).status).toBe('up-to-date')
  })

  it('requires a newer shell when the bundle minShell is above it', async () => {
    const manifest = makeManifest(NEW, bundleZip)
    ;(manifest.bundle as Record<string, unknown>).minShell = '1.1.0'
    const gh = await startGitHub({ manifest })
    const { updater } = makeUpdater({ apiBase: gh.apiBase })
    const state = await updater.check()
    expect(state.status).toBe('shell-required')
    expect(state.latest?.minShell).toBe('1.1.0')
    expect(state.latest?.shellDownloadUrl).toMatch(/universal\.dmg$/)
    await expect(updater.download()).rejects.toThrow(/No update is available/)
  })

  it('accepts a manifest without a shell section', async () => {
    const manifest = makeManifest(NEW, bundleZip)
    delete manifest.shell
    const gh = await startGitHub({ manifest })
    const state = await makeUpdater({ apiBase: gh.apiBase }).updater.check()
    expect(state.status).toBe('available')
    expect(state.latest?.shellDownloadUrl).toBeUndefined()
  })

  it('reports a rejected token', async () => {
    const gh = await startGitHub({ requireToken: 'ghp_' + 'b'.repeat(36) })
    const state = await makeUpdater({ apiBase: gh.apiBase, token: TOKEN }).updater.check()
    expect(state).toMatchObject({ status: 'error', error: 'GitHub rejected the access token.', needsToken: true, hasToken: true })
  })

  it('explains a 404 differently with and without a token', async () => {
    const gh = await startGitHub({ latest: () => ({ status: 404, body: { message: 'Not Found' } }) })
    const without = await makeUpdater({ apiBase: gh.apiBase }).updater.check()
    expect(without).toMatchObject({
      status: 'error',
      error: 'No release found. If the repository is private, add an access token below.',
      needsToken: true,
      hasToken: false,
    })
    const withToken = await makeUpdater({ apiBase: gh.apiBase, token: TOKEN }).updater.check()
    expect(withToken).toMatchObject({ status: 'error', error: `No release found for ${REPO}.`, hasToken: true })
    expect(withToken.needsToken).toBeUndefined()
  })

  it('surfaces rate limiting and other HTTP failures', async () => {
    const gh403 = await startGitHub({ latest: () => ({ status: 403, body: { message: 'rate limited' } }) })
    expect((await makeUpdater({ apiBase: gh403.apiBase }).updater.check()).error).toMatch(/HTTP 403.*rate-limited/)
    const gh500 = await startGitHub({ latest: () => ({ status: 500, body: {} }) })
    expect((await makeUpdater({ apiBase: gh500.apiBase }).updater.check()).error).toMatch(/HTTP 500/)
    const ghBad = await startGitHub({ latest: () => ({ status: 200, raw: '{not json' }) })
    expect((await makeUpdater({ apiBase: ghBad.apiBase }).updater.check()).error).toMatch(/unreadable/)
    const ghShape = await startGitHub({ latest: () => ({ status: 200, body: { tag_name: 'v1' } }) })
    expect((await makeUpdater({ apiBase: ghShape.apiBase }).updater.check()).error).toMatch(/unexpected/)
  })

  it('reports a server that cannot be reached', async () => {
    const gh = await startGitHub()
    const apiBase = gh.apiBase
    await gh.stop()
    const state = await makeUpdater({ apiBase }).updater.check()
    expect(state.status).toBe('error')
    expect(state.error).toMatch(/Could not reach 127\.0\.0\.1/)
  })

  it('fails when the release lacks the manifest or bundle asset', async () => {
    const noManifest = await startGitHub({ manifest: null })
    expect((await makeUpdater({ apiBase: noManifest.apiBase }).updater.check()).error).toMatch(/no orbit-manifest\.json asset/)
    const noBundle = await startGitHub({ bundle: null })
    expect((await makeUpdater({ apiBase: noBundle.apiBase }).updater.check()).error).toMatch(new RegExp(`no orbit-bundle-${NEW}\\.zip asset`))
    const missingFile = await startGitHub()
    missingFile.fileStatus.set('orbit-manifest.json', 404)
    expect((await makeUpdater({ apiBase: missingFile.apiBase }).updater.check()).error).toMatch(/orbit-manifest\.json \(HTTP 404\)/)
  })

  it.each<[string, Record<string, unknown>]>([
    ['unknown schema', { schema: 2 }],
    ['bad version', { version: 'v9.9.9' }],
    ['bad publishedAt', { publishedAt: 'yesterday' }],
    ['missing bundle', { bundle: undefined }],
    ['http bundle url', { bundle: { ...(makeManifest(NEW, Buffer.alloc(1)).bundle as object), url: 'http://github.com/x.zip' } }],
    ['short sha256', { bundle: { ...(makeManifest(NEW, Buffer.alloc(1)).bundle as object), sha256: 'abc' } }],
    ['zero size', { bundle: { ...(makeManifest(NEW, Buffer.alloc(1)).bundle as object), size: 0 } }],
    ['oversized bundle', { bundle: { ...(makeManifest(NEW, Buffer.alloc(1)).bundle as object), size: MAX_BUNDLE_BYTES + 1 } }],
    ['bad minShell', { bundle: { ...(makeManifest(NEW, Buffer.alloc(1)).bundle as object), minShell: '1' } }],
    ['bundle name mismatch', { bundle: { ...(makeManifest(NEW, Buffer.alloc(1)).bundle as object), name: 'orbit-bundle-1.0.0.zip' } }],
    ['non-https dmg url', { shell: { dmgUrl: 'ftp://example/x.dmg' } }],
    ['notes not a string', { notes: 12 }],
  ])('rejects a manifest with %s', async (_label, overrides) => {
    const gh = await startGitHub({ manifest: makeManifest(NEW, bundleZip, overrides) })
    const state = await makeUpdater({ apiBase: gh.apiBase }).updater.check()
    expect(state.status).toBe('error')
    expect(state.error).toMatch(/release manifest is invalid/)
  })

  it('accepts a bundle size right at the cap', async () => {
    const gh = await startGitHub({ manifest: makeManifest(NEW, bundleZip, { bundle: { ...(makeManifest(NEW, bundleZip).bundle as object), size: MAX_BUNDLE_BYTES } }) })
    const state = await makeUpdater({ apiBase: gh.apiBase }).updater.check()
    expect(state.status).toBe('available')
    expect(state.latest?.size).toBe(MAX_BUNDLE_BYTES)
  })

  it('stops reading a manifest body that streams past the size limit without a Content-Length', async () => {
    // Valid JSON, just padded past the cap; served chunked so the only defence is counting bytes while reading.
    const manifest = makeManifest(NEW, bundleZip, { notes: 'x'.repeat(MAX_MANIFEST_BYTES) })
    const gh = await startGitHub({ manifest })
    gh.chunked.add('orbit-manifest.json')
    const state = await makeUpdater({ apiBase: gh.apiBase }).updater.check()
    expect(state.status).toBe('error')
    expect(state.error).toMatch(/orbit-manifest\.json is unreasonably large/)
  })

  it('rejects a manifest whose Content-Length is over the limit without reading it', async () => {
    const manifest = makeManifest(NEW, bundleZip, { notes: 'x'.repeat(MAX_MANIFEST_BYTES) })
    const gh = await startGitHub({ manifest })
    const state = await makeUpdater({ apiBase: gh.apiBase }).updater.check()
    expect(state.status).toBe('error')
    expect(state.error).toMatch(/orbit-manifest\.json is unreasonably large/)
  })

  it('still reads a chunked manifest under the limit', async () => {
    const gh = await startGitHub()
    gh.chunked.add('orbit-manifest.json')
    const state = await makeUpdater({ apiBase: gh.apiBase }).updater.check()
    expect(state.status).toBe('available')
    expect(state.latest?.version).toBe(NEW)
  })

  it('rejects a manifest that is not JSON', async () => {
    const gh = await startGitHub({ manifest: null })
    gh.addAsset('orbit-manifest.json', '<html>')
    expect((await makeUpdater({ apiBase: gh.apiBase }).updater.check()).error).toMatch(/not valid JSON/)
  })

  it('resolves asset URLs relative to the API base', async () => {
    const gh = await startGitHub({
      latest: () => ({
        status: 200,
        body: { assets: [{ name: 'orbit-manifest.json', url: '/assets/1' }, { name: `orbit-bundle-${NEW}.zip`, url: '/assets/2' }] },
      }),
    })
    const state = await makeUpdater({ apiBase: gh.apiBase }).updater.check()
    expect(state.status).toBe('available')
  })

  it('refuses to follow a non-http(s) redirect', async () => {
    const gh = await startGitHub({
      latest: () => ({ status: 200, body: { assets: [{ name: 'orbit-manifest.json', url: 'file:///etc/passwd' }] } }),
    })
    const state = await makeUpdater({ apiBase: gh.apiBase }).updater.check()
    expect(state.error).toMatch(/non-https URL/)
  })

  it('shares one in-flight request between concurrent calls', async () => {
    const gh = await startGitHub()
    const { updater, states } = makeUpdater({ apiBase: gh.apiBase })
    const [a, b] = await Promise.all([updater.check(), updater.check()])
    expect(a).toEqual(b)
    expect(gh.requests(`/repos/`)).toHaveLength(1)
    expect(states.filter((s) => s.status === 'checking')).toHaveLength(1)
  })

  it('clears a previous error on the next check', async () => {
    const gh = await startGitHub({ manifest: null })
    const { updater } = makeUpdater({ apiBase: gh.apiBase })
    expect((await updater.check()).status).toBe('error')
    gh.addAsset('orbit-manifest.json', JSON.stringify(makeManifest(NEW, bundleZip)))
    const state = await updater.check()
    expect(state.status).toBe('available')
    expect(state.error).toBeUndefined()
  })

  it('refreshToken updates hasToken without a network call', async () => {
    let token: string | null = null
    const updater = new Updater({ repo: REPO, userData, builtInDir, shellVersion: SHELL, getToken: () => token })
    updater.resolveActive()
    expect(updater.getState().hasToken).toBe(false)
    token = TOKEN
    expect((await updater.refreshToken()).hasToken).toBe(true)
    token = null
    expect((await updater.refreshToken()).hasToken).toBe(false)
  })
})

// ── download ───────────────────────────────────────────────────────────

describe('download', () => {
  it('downloads, verifies, extracts and reports ready', async () => {
    writeBad([NEW])
    const gh = await startGitHub({ hops: 2, requireToken: TOKEN })
    const { updater, states } = makeUpdater({ apiBase: gh.apiBase, token: TOKEN })
    await updater.check()
    const state = await updater.download()

    expect(state.status).toBe('ready')
    expect(state.error).toBeUndefined()
    expect(state.progress).toBeUndefined()
    expect(state.latest?.version).toBe(NEW)
    expect(state.canRollback).toBe(false)

    const dir = path.join(bundlesDir(), NEW)
    expect(readFileSync(path.join(dir, 'index.html'), 'utf8')).toContain(`ORBIT ${NEW}`)
    expect(JSON.parse(readFileSync(path.join(dir, 'orbit-bundle.json'), 'utf8')).version).toBe(NEW)
    expect(readFileSync(path.join(dir, 'data', 'blob.bin')).equals(readFileSync(path.join(fixtures, `bundle-${NEW}`, 'data', 'blob.bin')))).toBe(true)
    expect(existsSync(path.join(bundlesDir(), 'tmp', `${NEW}.zip`))).toBe(false)
    expect(existsSync(path.join(bundlesDir(), 'tmp', NEW))).toBe(false)
    expect(readBad()).toEqual({ versions: [] })
    expect(existsSync(path.join(bundlesDir(), 'current.json'))).toBe(false)

    const downloading = states.filter((s) => s.status === 'downloading')
    expect(downloading.length).toBeGreaterThanOrEqual(1)
    let last = -1
    for (const s of downloading) {
      expect(s.progress?.total).toBe(bundleZip.length)
      expect(s.progress!.received).toBeGreaterThanOrEqual(last)
      expect(s.progress!.received).toBeLessThanOrEqual(bundleZip.length)
      last = s.progress!.received
    }
    expect(states.at(-1)?.status).toBe('ready')

    const bundleRequests = gh.requests(`/files/orbit-bundle-${NEW}.zip`)
    expect(bundleRequests).toHaveLength(1)
    expect(bundleRequests[0].headers.authorization).toBeUndefined()
    expect(gh.requests('/assets/2')[0].headers.authorization).toBe(`Bearer ${TOKEN}`)
  })

  it('keeps reporting ready when checked again for the same version', async () => {
    const gh = await startGitHub()
    const { updater } = makeUpdater({ apiBase: gh.apiBase })
    await updater.check()
    await updater.download()
    expect((await updater.check()).status).toBe('ready')
    expect((await updater.download()).status).toBe('ready')
    expect(gh.requests(`/files/orbit-bundle-${NEW}.zip`)).toHaveLength(1)
  })

  it('keeps a downloaded bundle ready to apply when a later check fails', async () => {
    const gh = await startGitHub()
    const { updater, relaunches, states } = makeUpdater({ apiBase: gh.apiBase })
    await updater.check()
    expect((await updater.download()).status).toBe('ready')

    // Offline now (the laptop left the Wi-Fi): the check fails, but the
    // verified download is still on disk and must stay applicable.
    await gh.stop()
    const state = await updater.check()
    expect(state.status).toBe('ready')
    expect(state.error).toMatch(/Could not reach/)
    expect(state.latest?.version).toBe(NEW)
    expect(states.at(-1)?.status).toBe('ready')
    expect((await updater.download()).status).toBe('ready')

    await updater.apply()
    expect(readCurrent()).toEqual({ version: NEW, previous: BUILT_IN })
    expect(relaunches).toEqual([{ reason: 'apply', version: NEW }])
  })

  it('clears the failed-check error once a check succeeds again, without downloading twice', async () => {
    const gh = await startGitHub()
    const { updater } = makeUpdater({ apiBase: gh.apiBase })
    await updater.check()
    await updater.download()
    const port = Number(new URL(gh.apiBase).port)
    await gh.stop()
    expect(await updater.check()).toMatchObject({ status: 'ready', error: expect.stringMatching(/Could not reach/) })

    // Back online at the same address.
    const again = await startGitHub({ port })
    const state = await updater.check()
    expect(state.status).toBe('ready')
    expect(state.error).toBeUndefined()
    expect(state.latest?.version).toBe(NEW)
    expect(again.requests(`/files/orbit-bundle-${NEW}.zip`)).toHaveLength(0)
  })

  it('drops the ready state on a failed check when the downloaded bundle has vanished', async () => {
    const gh = await startGitHub()
    const { updater } = makeUpdater({ apiBase: gh.apiBase })
    await updater.check()
    await updater.download()
    rmSync(path.join(bundlesDir(), NEW), { recursive: true })
    await gh.stop()
    const state = await updater.check()
    expect(state.status).toBe('error')
    await expect(updater.apply()).rejects.toThrow(/No downloaded update is ready/)
  })

  it('rejects a sha256 mismatch and cleans up', async () => {
    const manifest = makeManifest(NEW, bundleZip)
    ;(manifest.bundle as Record<string, unknown>).sha256 = 'f'.repeat(64)
    const gh = await startGitHub({ manifest })
    const { updater } = makeUpdater({ apiBase: gh.apiBase })
    await updater.check()
    const state = await updater.download()
    expect(state.status).toBe('error')
    expect(state.error).toMatch(/SHA-256 mismatch/)
    expect(state.progress).toBeUndefined()
    expect(existsSync(path.join(bundlesDir(), NEW))).toBe(false)
    expect(existsSync(path.join(bundlesDir(), 'tmp', `${NEW}.zip`))).toBe(false)
    expect((await updater.check()).status).toBe('available')
  })

  it('aborts as soon as the body exceeds the declared size', async () => {
    const manifest = makeManifest(NEW, bundleZip)
    ;(manifest.bundle as Record<string, unknown>).size = 70 * 1024
    const gh = await startGitHub({ manifest })
    const { updater } = makeUpdater({ apiBase: gh.apiBase })
    await updater.check()
    const state = await updater.download()
    expect(state.status).toBe('error')
    expect(state.error).toMatch(/larger than the 71680 bytes/)
    expect(existsSync(path.join(bundlesDir(), NEW))).toBe(false)
    expect(existsSync(path.join(bundlesDir(), 'tmp', `${NEW}.zip`))).toBe(false)
  })

  it('rejects a body shorter than the declared size', async () => {
    const manifest = makeManifest(NEW, bundleZip)
    ;(manifest.bundle as Record<string, unknown>).size = bundleZip.length + 1
    const gh = await startGitHub({ manifest })
    const { updater } = makeUpdater({ apiBase: gh.apiBase })
    await updater.check()
    const state = await updater.download()
    expect(state.error).toMatch(new RegExp(`Downloaded ${bundleZip.length} bytes but the manifest says ${bundleZip.length + 1}`))
  })

  it('reports a missing bundle asset', async () => {
    const gh = await startGitHub()
    gh.fileStatus.set(`orbit-bundle-${NEW}.zip`, 404)
    const { updater } = makeUpdater({ apiBase: gh.apiBase })
    await updater.check()
    expect((await updater.download()).error).toMatch(new RegExp(`orbit-bundle-${NEW}\\.zip \\(HTTP 404\\)`))
  })

  it('rejects an archive that escapes the extraction directory', async () => {
    const evil = zipEntriesWithPython(path.join(fixtures, 'evil-bundle.zip'), [
      ['index.html', '<!doctype html>'],
      ['orbit-bundle.json', JSON.stringify({ version: NEW, minShell: '1.0.0' })],
      ['../../escaped.txt', 'nope'],
    ])
    const gh = await startGitHub({ manifest: makeManifest(NEW, evil), bundle: evil })
    const { updater } = makeUpdater({ apiBase: gh.apiBase })
    await updater.check()
    const state = await updater.download()
    expect(state.status).toBe('error')
    expect(state.error).toMatch(/could not be unpacked.*unsafe entry path/)
    expect(existsSync(path.join(userData, 'escaped.txt'))).toBe(false)
    expect(existsSync(path.join(bundlesDir(), 'escaped.txt'))).toBe(false)
    expect(existsSync(path.join(bundlesDir(), NEW))).toBe(false)
    expect(existsSync(path.join(bundlesDir(), 'tmp', NEW))).toBe(false)
  })

  it('rejects an archive whose stamp does not match the manifest version', async () => {
    const tree = path.join(fixtures, 'wrong-stamp')
    writeBundleTree(tree, { version: '9.9.8', minShell: '1.0.0' })
    const zip = zipWithPython(tree, path.join(fixtures, 'wrong-stamp.zip'), 'deflate')
    const gh = await startGitHub({ manifest: makeManifest(NEW, zip), bundle: zip })
    const { updater } = makeUpdater({ apiBase: gh.apiBase })
    await updater.check()
    const state = await updater.download()
    expect(state.error).toMatch(/reports version "9.9.8", not 9.9.9/)
    expect(existsSync(path.join(bundlesDir(), NEW))).toBe(false)
  })

  it('rejects an archive without index.html', async () => {
    const zip = zipEntriesWithPython(path.join(fixtures, 'no-index.zip'), [['orbit-bundle.json', JSON.stringify({ version: NEW, minShell: '1.0.0' })]])
    const gh = await startGitHub({ manifest: makeManifest(NEW, zip), bundle: zip })
    const { updater } = makeUpdater({ apiBase: gh.apiBase })
    await updater.check()
    expect((await updater.download()).error).toMatch(/no index\.html/)
  })

  it('rejects a bundle whose own stamp needs a newer shell', async () => {
    const tree = path.join(fixtures, 'needs-shell')
    writeBundleTree(tree, { version: NEW, minShell: '3.0.0' })
    const zip = zipWithCli(tree, path.join(fixtures, 'needs-shell.zip'))
    const gh = await startGitHub({ manifest: makeManifest(NEW, zip), bundle: zip })
    const { updater } = makeUpdater({ apiBase: gh.apiBase })
    await updater.check()
    expect((await updater.download()).error).toMatch(/needs ORBIT 3\.0\.0/)
  })

  it('rejects download() before a successful check()', async () => {
    const { updater } = makeUpdater()
    await expect(updater.download()).rejects.toThrow(/check for updates first/)
  })

  it('shares one in-flight download between concurrent calls', async () => {
    const gh = await startGitHub()
    const { updater } = makeUpdater({ apiBase: gh.apiBase })
    await updater.check()
    const [a, b] = await Promise.all([updater.download(), updater.download()])
    expect(a.status).toBe('ready')
    expect(b.status).toBe('ready')
    expect(gh.requests(`/files/orbit-bundle-${NEW}.zip`)).toHaveLength(1)
  })

  it('replaces a stale directory of the same version', async () => {
    const stale = installBundle(NEW)
    writeFileSync(path.join(stale, 'stale.txt'), 'old')
    const gh = await startGitHub()
    const { updater } = makeUpdater({ apiBase: gh.apiBase })
    // resolveActive GC'd the stale dir (not current); recreate to simulate a leftover.
    installBundle(NEW)
    writeFileSync(path.join(stale, 'stale.txt'), 'old')
    await updater.check()
    expect((await updater.download()).status).toBe('ready')
    expect(existsSync(path.join(stale, 'stale.txt'))).toBe(false)
  })
})

// ── apply / rollback ───────────────────────────────────────────────────

describe('apply and rollback', () => {
  it('apply points current.json at the new bundle and asks for a relaunch', async () => {
    const gh = await startGitHub()
    const { updater, relaunches } = makeUpdater({ apiBase: gh.apiBase })
    await updater.check()
    await updater.download()
    await updater.apply()
    expect(readCurrent()).toEqual({ version: NEW, previous: BUILT_IN })
    expect(relaunches).toEqual([{ reason: 'apply', version: NEW }])

    // "Relaunch": a fresh updater on the same userData serves the download.
    const next = makeUpdater({ apiBase: gh.apiBase })
    expect(next.updater.active).toEqual({ dir: path.join(bundlesDir(), NEW), version: NEW, builtIn: false })
    expect(next.updater.getState()).toMatchObject({ current: NEW, canRollback: true })
    expect(existsSync(path.join(bundlesDir(), NEW, 'index.html'))).toBe(true)
  })

  it('keeps the previous downloaded bundle across a second update', async () => {
    installBundle('9.9.8')
    writeCurrent({ version: '9.9.8', previous: null })
    const gh = await startGitHub()
    const { updater } = makeUpdater({ apiBase: gh.apiBase })
    expect(updater.active?.version).toBe('9.9.8')
    await updater.check()
    await updater.download()
    await updater.apply()
    expect(readCurrent()).toEqual({ version: NEW, previous: '9.9.8' })
    const next = makeUpdater({ apiBase: gh.apiBase })
    expect(next.updater.active?.version).toBe(NEW)
    expect(existsSync(path.join(bundlesDir(), '9.9.8'))).toBe(true)
  })

  it('apply refuses when nothing is ready or the bundle vanished', async () => {
    const gh = await startGitHub()
    const { updater, relaunches, states } = makeUpdater({ apiBase: gh.apiBase })
    await expect(updater.apply()).rejects.toThrow(/No downloaded update is ready/)
    await updater.check()
    await updater.download()
    rmSync(path.join(bundlesDir(), NEW), { recursive: true })
    await expect(updater.apply()).rejects.toThrow(/can no longer be used/)
    expect(states.at(-1)?.status).toBe('error')
    expect(relaunches).toEqual([])
    expect(existsSync(path.join(bundlesDir(), 'current.json'))).toBe(false)
  })

  it('rollback returns to the built-in bundle and the old download is collected at boot', async () => {
    installBundle(NEW)
    writeCurrent({ version: NEW, previous: BUILT_IN })
    const { updater, relaunches } = makeUpdater()
    expect(updater.getState().canRollback).toBe(true)
    await updater.rollback()
    expect(readCurrent()).toEqual({ version: null, previous: null })
    expect(relaunches).toEqual([{ reason: 'rollback', version: NEW }])

    const next = makeUpdater()
    expect(next.updater.active).toEqual({ dir: builtInDir, version: BUILT_IN, builtIn: true })
    expect(next.updater.getState().canRollback).toBe(false)
    expect(existsSync(path.join(bundlesDir(), NEW))).toBe(false)
  })

  it('rollback refuses on the built-in bundle', async () => {
    const { updater, relaunches } = makeUpdater()
    await expect(updater.rollback()).rejects.toThrow(/already active/)
    expect(relaunches).toEqual([])
  })

  it('a rolled-back version can be offered again by check()', async () => {
    installBundle(NEW)
    writeCurrent({ version: NEW, previous: BUILT_IN })
    await makeUpdater().updater.rollback()
    const gh = await startGitHub()
    const { updater } = makeUpdater({ apiBase: gh.apiBase })
    expect((await updater.check()).status).toBe('available')
  })
})

// ── the app updating itself ─────────────────────────────────────────────

describe('app update (shell-required)', () => {
  const APP_ZIP = `ORBIT-${NEW}-universal-mac.zip`
  let appZip: Buffer

  beforeAll(() => {
    // The shape scripts/make-mac-zip.mjs produces: ORBIT <v>/ORBIT.app/…
    const tree = path.join(fixtures, 'mac-zip')
    mkdirSync(path.join(tree, `ORBIT ${NEW}`, 'ORBIT.app', 'Contents', 'MacOS'), { recursive: true })
    writeFileSync(path.join(tree, `ORBIT ${NEW}`, 'ORBIT.app', 'Contents', 'MacOS', 'ORBIT'), 'binary')
    writeFileSync(path.join(tree, `ORBIT ${NEW}`, 'ORBIT.app', 'Contents', 'version.txt'), NEW)
    writeFileSync(path.join(tree, `ORBIT ${NEW}`, 'Install ORBIT.txt'), 'drag it')
    appZip = zipWithPython(tree, path.join(fixtures, APP_ZIP), 'deflate')
  })

  interface FakeInstaller {
    supported: () => { ok: true } | { ok: false; reason: string }
    extract: (zip: string, dest: string) => Promise<void>
    findApp: (dir: string) => string | null
    verify: (app: string, version: string) => Promise<void>
    install: (app: string, workDir: string) => void
    verified: Array<[string, string]>
    installed: Array<[string, string]>
  }

  function fakeInstaller(over: Partial<FakeInstaller> = {}): FakeInstaller {
    const inst: FakeInstaller = {
      supported: () => ({ ok: true }),
      extract: async (zip, dest) => {
        const r = spawnSync('python3', ['-c', 'import sys, zipfile; zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])', zip, dest], { encoding: 'utf8' })
        if (r.status !== 0) throw new Error(r.stderr)
      },
      findApp: (dir) => findAppIn(dir, 'ORBIT'),
      verify: async (app, version) => {
        inst.verified.push([app, version])
        const found = readFileSync(path.join(app, 'Contents', 'version.txt'), 'utf8')
        if (found !== version) throw new Error(`it says it is version ${found}, not ${version}`)
      },
      install: (app, workDir) => {
        inst.installed.push([app, workDir])
      },
      verified: [],
      installed: [],
      ...over,
    }
    return inst
  }

  function withShellZip(extra: Record<string, unknown> = {}) {
    const manifest = makeManifest(NEW, bundleZip)
    ;(manifest.bundle as Record<string, unknown>).minShell = '2.0.0'
    manifest.shell = { ...(manifest.shell as object), zipSha256: sha256(appZip), zipSize: appZip.length, ...extra }
    return manifest
  }

  async function harness(opts: { installer?: FakeInstaller | null; manifest?: Record<string, unknown>; zip?: Buffer | null } = {}) {
    const gh = await startGitHub({ manifest: opts.manifest ?? withShellZip() })
    if (opts.zip !== null) gh.addAsset(APP_ZIP, opts.zip ?? appZip)
    const installer = opts.installer === undefined ? fakeInstaller() : opts.installer
    const logs: string[] = []
    const updater = new Updater({
      repo: REPO,
      apiBase: gh.apiBase,
      userData,
      builtInDir,
      shellVersion: SHELL,
      log: (...args: unknown[]) => logs.push(args.map(String).join(' ')),
      ...(installer ? { shellInstaller: installer } : {}),
    })
    const quits: Array<{ reason: string; version: string }> = []
    const states: UpdateState[] = []
    updater.on('quit', (q: { reason: string; version: string }) => quits.push(q))
    updater.on('state', (s: UpdateState) => states.push(s))
    updater.resolveActive()
    expect((await updater.check()).status).toBe('shell-required')
    return { gh, updater, installer, quits, states, logs }
  }

  it('reads the app zip hash from the manifest', async () => {
    const { updater } = await harness()
    expect(updater.getState().latest?.shellZip).toEqual({ size: appZip.length, sha256: sha256(appZip) })
  })

  it('downloads the latest app, checks its hash, unpacks it, verifies it, and installs it on request', async () => {
    const { gh, updater, installer, quits, states } = await harness()
    const state = await updater.downloadShell()
    expect(state.status).toBe('shell-required')
    expect(state.shellUpdate).toEqual({ status: 'ready', version: NEW })
    expect(installer!.verified).toHaveLength(1)
    const [app, version] = installer!.verified[0]
    expect(version).toBe(NEW)
    expect(app).toBe(path.join(userData, 'shell-update', NEW, `ORBIT ${NEW}`, 'ORBIT.app'))
    expect(existsSync(path.join(userData, 'shell-update', `${NEW}.zip`))).toBe(false)
    expect(states.some((s) => s.shellUpdate?.status === 'downloading')).toBe(true)
    expect(gh.requests(`/files/${APP_ZIP}`)).toHaveLength(1)

    await updater.installShell()
    expect(installer!.installed).toEqual([[app, path.join(userData, 'shell-update')]])
    expect(quits).toEqual([{ reason: 'shell', version: NEW }])
  })

  it('still works when the release recorded no hash, checking the size GitHub reports', async () => {
    const manifest = makeManifest(NEW, bundleZip)
    ;(manifest.bundle as Record<string, unknown>).minShell = '2.0.0'
    const { updater } = await harness({ manifest })
    expect(updater.getState().latest?.shellZip).toBeUndefined()
    expect((await updater.downloadShell()).shellUpdate?.status).toBe('ready')
  })

  it('refuses an app whose hash does not match, and cleans up', async () => {
    const { updater, installer } = await harness({ manifest: withShellZip({ zipSha256: 'f'.repeat(64) }) })
    const state = await updater.downloadShell()
    expect(state.shellUpdate).toMatchObject({ status: 'error', error: expect.stringMatching(/integrity check/) })
    expect(installer!.verified).toHaveLength(0)
    expect(existsSync(path.join(userData, 'shell-update'))).toBe(false)
    await expect(updater.installShell()).rejects.toThrow(/No downloaded app/)
  })

  it('refuses an app that is not the version the release says', async () => {
    const installer = fakeInstaller({ verify: async () => { throw new Error('it says it is version 1.0.0, not 9.9.9') } })
    const { updater, quits } = await harness({ installer })
    const state = await updater.downloadShell()
    expect(state.shellUpdate?.status).toBe('error')
    expect(state.shellUpdate?.error).toMatch(/did not pass its checks.*not 9\.9\.9/)
    await expect(updater.installShell()).rejects.toThrow()
    expect(quits).toHaveLength(0)
  })

  it('reports a release without the app zip', async () => {
    const { updater } = await harness({ zip: null })
    expect((await updater.downloadShell()).shellUpdate?.error).toMatch(new RegExp(`no ${APP_ZIP.replace(/\./g, '\\.')} asset`))
  })

  it('says why, without downloading, when this copy cannot replace itself', async () => {
    const installer = fakeInstaller({ supported: () => ({ ok: false, reason: 'Move ORBIT into Applications first.' }) })
    const { gh, updater } = await harness({ installer })
    const state = await updater.downloadShell()
    expect(state.shellUpdate).toEqual({ status: 'manual', version: NEW, error: 'Move ORBIT into Applications first.' })
    expect(gh.requests(`/files/${APP_ZIP}`)).toHaveLength(0)
  })

  it('is manual when the shell has no installer at all', async () => {
    const { updater } = await harness({ installer: null })
    expect((await updater.downloadShell()).shellUpdate?.status).toBe('manual')
  })

  it('refuses to download an app when none is needed', async () => {
    const gh = await startGitHub()
    const updater = new Updater({ repo: REPO, apiBase: gh.apiBase, userData, builtInDir, shellVersion: SHELL, shellInstaller: fakeInstaller() })
    updater.resolveActive()
    await updater.check()
    await expect(updater.downloadShell()).rejects.toThrow(/No app update is needed/)
  })

  it('shares one in-flight app download between concurrent calls', async () => {
    const { gh, updater } = await harness()
    const [a, b] = await Promise.all([updater.downloadShell(), updater.downloadShell()])
    expect(a.shellUpdate?.status).toBe('ready')
    expect(b.shellUpdate?.status).toBe('ready')
    expect(gh.requests(`/files/${APP_ZIP}`)).toHaveLength(1)
  })

  it('rejects a manifest with a malformed app hash or size', async () => {
    for (const extra of [{ zipSha256: 'nope' }, { zipSize: -1 }, { zipSize: 2 ** 31 }]) {
      const gh = await startGitHub({ manifest: withShellZip(extra) })
      const updater = new Updater({ repo: REPO, apiBase: gh.apiBase, userData, builtInDir, shellVersion: SHELL })
      updater.resolveActive()
      const state = await updater.check()
      expect(state.status).toBe('error')
      expect(state.error).toMatch(/manifest is invalid: shell zip/)
    }
  })

  it('clears an app download left over from an earlier session at boot', () => {
    mkdirSync(path.join(userData, 'shell-update', NEW), { recursive: true })
    writeFileSync(path.join(userData, 'shell-update', `${NEW}.zip`), 'partial')
    makeUpdater()
    expect(existsSync(path.join(userData, 'shell-update'))).toBe(false)
  })
})
