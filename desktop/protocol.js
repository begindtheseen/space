// `app://orbit/` serves the active web bundle from disk. The origin never changes
// (IndexedDB lives under it), only the directory behind it, and that is fixed for
// the lifetime of the process.
import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { net, protocol } from 'electron'

export const APP_SCHEME = 'app'
export const APP_HOST = 'orbit'
export const APP_ORIGIN = `${APP_SCHEME}://${APP_HOST}`
export const APP_URL = `${APP_ORIGIN}/`

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.map': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.data': 'application/octet-stream',
  '.csv': 'text/csv; charset=utf-8',
}

/**
 * Every response says the page is cross-origin isolated. That is what lets the
 * natural voice use several cores on one sentence (WebAssembly threads need
 * SharedArrayBuffer, which a browser only gives an isolated page): measured,
 * four threads make a sentence about three times sooner than one.
 * `credentialless` rather than `require-corp`: things from other sites (the
 * voice model, the script runtimes from the CDNs, lesson images) still load,
 * just without cookies, and the video embed is marked `credentialless` too.
 */
export const ISOLATION_HEADERS = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'credentialless',
}

/** Must run before `app.whenReady()`. */
export function registerAppScheme() {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: APP_SCHEME,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        stream: true,
        bypassCSP: false,
        corsEnabled: true,
      },
    },
  ])
}

/**
 * Must run after ready. `activeDir` is the bundle directory to serve.
 * @param {string} activeDir
 * @param {(...args: unknown[]) => void} log
 */
export function installAppProtocol(activeDir, log = () => {}) {
  const root = path.resolve(activeDir)
  protocol.handle(APP_SCHEME, (request) =>
    serve(root, request).catch((err) => {
      log('protocol: unexpected failure for', request.url, err)
      return text(500, 'Internal error')
    }),
  )
}

function text(status, body = '', headers = {}) {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache', ...ISOLATION_HEADERS, ...headers },
  })
}

/**
 * @param {string} root resolved active directory
 * @param {Request} request
 */
async function serve(root, request) {
  let url
  try {
    url = new URL(request.url)
  } catch {
    return text(400, 'Bad request')
  }
  if (url.host !== APP_HOST) return text(404, 'Not found')
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return text(405, 'Method not allowed', { Allow: 'GET, HEAD' })
  }

  let pathname
  try {
    pathname = decodeURIComponent(url.pathname)
  } catch {
    return text(400, 'Bad request')
  }
  if (pathname === '' || pathname === '/') pathname = '/index.html'
  if (pathname.includes('..') || pathname.includes('\0') || pathname.includes('\\')) {
    return text(403, 'Forbidden')
  }

  // `pathname` always starts with '/', so `.` + pathname keeps it relative to root.
  const file = path.resolve(root, `.${pathname}`)
  if (file !== root && !file.startsWith(root + path.sep)) return text(403, 'Forbidden')

  let stat
  try {
    stat = await fs.stat(file)
  } catch (err) {
    if (err.code === 'ENOENT' || err.code === 'ENOTDIR') return text(404, 'Not found')
    throw err
  }
  if (!stat.isFile()) return text(404, 'Not found')

  const headers = {
    'Content-Type': MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream',
    'Cache-Control': 'no-cache',
    ...ISOLATION_HEADERS,
  }
  if (request.method === 'HEAD') return new Response(null, { status: 200, headers })

  const upstream = await net.fetch(pathToFileURL(file).href)
  if (!upstream.ok) return text(500, 'Could not read file')
  return new Response(upstream.body, { status: 200, headers })
}
