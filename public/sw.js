/* ============================================================================
   ORBIT — service worker
   ----------------------------------------------------------------------------
   Deliberately conservative. The app's own shell is precached so it launches
   offline; everything else uses stale-while-revalidate so a stale asset never
   wins over a fresh one for long.

   Two things are explicitly NOT cached here:
     · the Pyodide and SQLite runtimes — tens of megabytes, and the browser's
       own HTTP cache already handles them with correct immutable headers
     · anything non-GET, or cross-origin beyond the font and CDN hosts
   ========================================================================== */

const VERSION = 'orbit-v1'
const SHELL = `${VERSION}-shell`
const RUNTIME = `${VERSION}-runtime`

const PRECACHE = ['./', './index.html', './manifest.webmanifest', './icon.svg']

const PASSTHROUGH_HOSTS = ['cdn.jsdelivr.net']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)

  // Large WASM runtimes: let the network and the HTTP cache handle them.
  if (PASSTHROUGH_HOSTS.includes(url.hostname)) return

  // Navigations: network first, so a deployed update is picked up immediately,
  // with the cached shell as the offline fallback.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          void caches.open(SHELL).then((c) => c.put('./index.html', copy))
          return res
        })
        .catch(() => caches.match('./index.html').then((r) => r || Response.error())),
    )
    return
  }

  /* Everything the app needs is same-origin now that the typefaces ship with
     the build — a cross-origin request is something we did not put here, and
     the service worker stays out of it. */
  if (url.origin !== location.origin) return

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type !== 'opaque') {
            const copy = res.clone()
            void caches.open(RUNTIME).then((c) => c.put(req, copy))
          }
          return res
        })
        .catch(() => cached || Response.error())
      return cached || network
    }),
  )
})
