/* ============================================================================
   Shared fixtures for the desktop tests
   ----------------------------------------------------------------------------
   Real bundle trees, real zip files (Python zipfile + the zip CLI) and a real
   HTTP server that mimics the two GitHub endpoints the updater talks to. No
   mocking of fetch: the updater's redirect handling is exactly what we want
   to exercise against a network stack.
   ========================================================================== */
import { createHash, randomBytes } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import type { AddressInfo } from 'node:net'

export const REPO = 'begindtheseen/space'

// ── temp dirs ──────────────────────────────────────────────────────────

export function makeTempDir(label: string): string {
  return mkdtempSync(path.join(tmpdir(), `orbit-${label}-`))
}

export function removeDir(dir: string): void {
  rmSync(dir, { recursive: true, force: true })
}

// ── bundle trees ───────────────────────────────────────────────────────

export interface BundleMeta {
  version: string
  minShell: string
  builtAt?: string
  commit?: string | null
}

/** Writes a small dist-like tree with the files the updater checks for. */
export function writeBundleTree(dir: string, meta: BundleMeta, extraFiles: Record<string, Buffer | string> = {}): void {
  mkdirSync(path.join(dir, 'assets'), { recursive: true })
  mkdirSync(path.join(dir, 'data', 'nested'), { recursive: true })
  writeFileSync(path.join(dir, 'index.html'), `<!doctype html><title>ORBIT ${meta.version}</title><script src="./assets/app.js"></script>\n`)
  writeFileSync(path.join(dir, 'assets', 'app.js'), `console.log(${JSON.stringify(meta.version)})\n`.repeat(200))
  writeFileSync(path.join(dir, 'assets', 'style.css'), 'body{background:#000208}\n')
  writeFileSync(path.join(dir, 'data', 'nested', 'ünïcödé — file.txt'), 'utf-8 name\n')
  writeFileSync(path.join(dir, 'data', 'empty.bin'), Buffer.alloc(0))
  // Random bytes do not deflate, so this exercises the stored path in tools
  // that pick per-file and forces multi-chunk streaming in the downloader.
  writeFileSync(path.join(dir, 'data', 'blob.bin'), randomBytes(300 * 1024))
  writeFileSync(
    path.join(dir, 'orbit-bundle.json'),
    JSON.stringify({ builtAt: '2026-09-22T00:00:00Z', commit: 'abc1234', ...meta }, null, 2) + '\n',
  )
  for (const [rel, content] of Object.entries(extraFiles)) {
    mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true })
    writeFileSync(path.join(dir, rel), content)
  }
}

// ── zip builders ───────────────────────────────────────────────────────

function run(cmd: string, args: string[], cwd?: string): void {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8' })
  if (r.error) throw r.error
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} failed (${r.status}):\n${r.stdout}\n${r.stderr}`)
}

const PY_ZIP_TREE = `
import os, sys, zipfile
src, out, method = sys.argv[1], sys.argv[2], sys.argv[3]
m = zipfile.ZIP_DEFLATED if method == 'deflate' else zipfile.ZIP_STORED
with zipfile.ZipFile(out, 'w', compression=m) as zf:
    for root, dirs, files in os.walk(src):
        dirs.sort()
        rel_root = os.path.relpath(root, src)
        if rel_root != '.':
            zf.write(root, rel_root + '/')
        for name in sorted(files):
            full = os.path.join(root, name)
            zf.write(full, os.path.join(rel_root, name) if rel_root != '.' else name)
`

/** Zips `srcDir` with Python's zipfile, including explicit directory entries. */
export function zipWithPython(srcDir: string, outFile: string, method: 'deflate' | 'store'): Buffer {
  run('python3', ['-c', PY_ZIP_TREE, srcDir, outFile, method])
  return readFileSync(outFile)
}

/** Zips the contents of `srcDir` exactly the way scripts/make-bundle.mjs does. */
export function zipWithCli(srcDir: string, outFile: string): Buffer {
  run('zip', ['-r', '-X', '-q', outFile, '.'], srcDir)
  return readFileSync(outFile)
}

const PY_ZIP_ENTRIES = `
import sys, zipfile, json
out = sys.argv[1]
entries = json.loads(sys.argv[2])
with zipfile.ZipFile(out, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
    for name, content in entries:
        zf.writestr(name, content)
`

/** Builds a zip with arbitrary (possibly hostile) entry names. */
export function zipEntriesWithPython(outFile: string, entries: Array<[string, string]>): Buffer {
  run('python3', ['-c', PY_ZIP_ENTRIES, outFile, JSON.stringify(entries)])
  return readFileSync(outFile)
}

const PY_ZIP64 = `
import sys, zipfile
out = sys.argv[1]
with zipfile.ZipFile(out, 'w') as zf:
    with zf.open('big.txt', 'w', force_zip64=True) as f:
        f.write(b'x' * 10)
`

/** A tiny archive whose local header carries zip64 markers (0xFFFFFFFF sizes). */
export function zip64WithPython(outFile: string): Buffer {
  run('python3', ['-c', PY_ZIP64, outFile])
  return readFileSync(outFile)
}

/** An archive with a password-protected entry, made with the zip CLI. */
export function encryptedZipWithCli(workDir: string, outFile: string): Buffer {
  writeFileSync(path.join(workDir, 'secret.txt'), 'shh\n')
  run('zip', ['-q', '-P', 'hunter2', outFile, 'secret.txt'], workDir)
  return readFileSync(outFile)
}

export function sha256(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex')
}

// ── fake GitHub ────────────────────────────────────────────────────────

export interface SeenRequest {
  method: string
  path: string
  headers: IncomingMessage['headers']
}

export interface FakeGitHubOptions {
  repo?: string
  /** Number of redirects between /assets/<id> and the file bytes (default 1). */
  hops?: number
  /** Override the /releases/latest response entirely. */
  latest?: (req: IncomingMessage) => { status: number; body?: unknown; raw?: string }
  /** When set, /repos/* answers 401 unless this exact bearer token is sent. */
  requireToken?: string
}

export interface ReleaseAsset {
  name: string
  url: string
  size: number
}

/**
 * A stand-in for api.github.com + the redirect to storage. Every request is
 * recorded so tests can assert on headers (in particular that Authorization
 * never survives a redirect).
 */
export class FakeGitHub {
  readonly files = new Map<string, Buffer>()
  readonly seen: SeenRequest[] = []
  /** Per-file status override, e.g. to simulate a missing asset. */
  readonly fileStatus = new Map<string, number>()
  /** Files served without a Content-Length header (chunked transfer encoding). */
  readonly chunked = new Set<string>()
  private server: Server | null = null
  private origin = ''
  private readonly repo: string
  private readonly hops: number
  private readonly latest?: FakeGitHubOptions['latest']
  private readonly requireToken?: string

  constructor(opts: FakeGitHubOptions = {}) {
    this.repo = opts.repo ?? REPO
    this.hops = opts.hops ?? 1
    this.latest = opts.latest
    this.requireToken = opts.requireToken
  }

  get apiBase(): string {
    return this.origin
  }

  /** Listens on `port` (default: any free port) — pass a previous port to come back at the same address. */
  async start(port = 0): Promise<string> {
    this.server = createServer((req, res) => this.handle(req, res))
    await new Promise<void>((resolve) => this.server!.listen(port, '127.0.0.1', resolve))
    const bound = (this.server!.address() as AddressInfo).port
    this.origin = `http://127.0.0.1:${bound}`
    return this.origin
  }

  async stop(): Promise<void> {
    const server = this.server
    this.server = null
    if (!server) return
    server.closeAllConnections()
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }

  /** Registers a file that shows up as a release asset. */
  addAsset(name: string, body: Buffer | string): void {
    this.files.set(name, Buffer.isBuffer(body) ? body : Buffer.from(body))
  }

  assets(): ReleaseAsset[] {
    return [...this.files.entries()].map(([name, body], i) => ({
      name,
      url: `${this.origin}/assets/${i + 1}`,
      size: body.length,
    }))
  }

  requests(prefix: string): SeenRequest[] {
    return this.seen.filter((r) => r.path.startsWith(prefix))
  }

  private handle(req: IncomingMessage, res: ServerResponse): void {
    const url = new URL(req.url ?? '/', this.origin)
    this.seen.push({ method: req.method ?? 'GET', path: url.pathname, headers: req.headers })

    if (url.pathname === `/repos/${this.repo}/releases/latest`) {
      if (this.requireToken !== undefined && req.headers.authorization !== `Bearer ${this.requireToken}`) {
        return this.json(res, 401, { message: 'Bad credentials' })
      }
      if (this.latest) {
        const out = this.latest(req)
        if (out.raw !== undefined) {
          res.writeHead(out.status, { 'content-type': 'application/json' })
          return void res.end(out.raw)
        }
        return this.json(res, out.status, out.body ?? {})
      }
      return this.json(res, 200, {
        tag_name: 'v9.9.9',
        name: 'fixture release',
        draft: false,
        prerelease: false,
        assets: this.assets(),
      })
    }

    const assetMatch = /^\/assets\/(\d+)$/.exec(url.pathname)
    if (assetMatch) {
      const asset = this.assets()[Number(assetMatch[1]) - 1]
      if (!asset) return this.json(res, 404, { message: 'Not Found' })
      return this.redirect(res, this.hops > 1 ? `/hop/1/${encodeURIComponent(asset.name)}` : `/files/${encodeURIComponent(asset.name)}`)
    }

    const hopMatch = /^\/hop\/(\d+)\/(.+)$/.exec(url.pathname)
    if (hopMatch) {
      const n = Number(hopMatch[1])
      const next = n + 1 >= this.hops ? `/files/${hopMatch[2]}` : `/hop/${n + 1}/${hopMatch[2]}`
      return this.redirect(res, next)
    }

    const fileMatch = /^\/files\/(.+)$/.exec(url.pathname)
    if (fileMatch) {
      const name = decodeURIComponent(fileMatch[1])
      const override = this.fileStatus.get(name)
      if (override !== undefined) return this.json(res, override, { message: `status ${override}` })
      const body = this.files.get(name)
      if (!body) return this.json(res, 404, { message: 'Not Found' })
      const headers: Record<string, string | number> = { 'content-type': 'application/octet-stream' }
      if (!this.chunked.has(name)) headers['content-length'] = body.length
      res.writeHead(200, headers)
      // Chunked delivery so progress reporting sees several reads.
      let offset = 0
      const step = 64 * 1024
      const pump = () => {
        if (offset >= body.length) return void res.end()
        const chunk = body.subarray(offset, offset + step)
        offset += step
        res.write(chunk, () => setImmediate(pump))
      }
      pump()
      return
    }

    this.json(res, 404, { message: 'Not Found' })
  }

  private json(res: ServerResponse, status: number, body: unknown): void {
    res.writeHead(status, { 'content-type': 'application/json' })
    res.end(JSON.stringify(body))
  }

  private redirect(res: ServerResponse, location: string): void {
    res.writeHead(302, { location: `${this.origin}${location}`, 'content-type': 'text/plain' })
    res.end('redirecting')
  }
}

/** A manifest that matches the given bundle zip. */
export function makeManifest(version: string, zip: Buffer, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const base = `https://github.com/${REPO}/releases/download/v${version}`
  return {
    schema: 1,
    version,
    publishedAt: '2026-09-22T00:00:00Z',
    notes: `Release v${version}`,
    bundle: {
      name: `orbit-bundle-${version}.zip`,
      url: `${base}/orbit-bundle-${version}.zip`,
      sha256: sha256(zip),
      size: zip.length,
      minShell: '1.0.0',
    },
    shell: {
      version,
      dmgUrl: `${base}/ORBIT-${version}-universal.dmg`,
      zipUrl: `${base}/ORBIT-${version}-universal-mac.zip`,
    },
    ...overrides,
  }
}
