/* ============================================================================
   ORBIT — Python runtime worker
   ----------------------------------------------------------------------------
   Pyodide must run in a module-type worker: `pyodide.asm.mjs` is an ES module,
   so a classic worker with `importScripts()` cannot load it. It also has to be
   off the main thread regardless — the runtime is ~13MB and a tight loop in
   learner code would otherwise freeze the entire app.

   Cancellation is by `worker.terminate()` from the main thread rather than by
   an interrupt buffer. `setInterruptBuffer` needs a SharedArrayBuffer, which
   needs COOP/COEP response headers, which a static host like GitHub Pages
   cannot set. Terminating and respawning costs a few seconds of reboot and
   works everywhere, so that is what ships.
   ========================================================================== */

/// <reference lib="webworker" />

const PYODIDE_VERSION = '314.0.7'
const PYODIDE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.mjs`

/* The npm mirror at /npm/pyodide@… carries the runtime but NOT the package
   wheels, so numpy and friends 404. The /pyodide/v…/full/ path is the one with
   a complete distribution. */

interface PyodideLike {
  runPythonAsync(code: string, options?: { globals?: unknown }): Promise<unknown>
  runPython(code: string): { destroy?: () => void }
  loadPackage(names: string[]): Promise<void>
  loadPackagesFromImports(code: string): Promise<void>
  setStdout(opts: { batched: (s: string) => void }): void
  setStderr(opts: { batched: (s: string) => void }): void
  setStdin(opts: { stdin?: () => string | null; error?: boolean }): void
  globals: { set(k: string, v: unknown): void }
}

type Incoming =
  | { cmd: 'init'; packages?: string[] }
  | { cmd: 'run'; id: number; code: string; stdin?: string[]; packages?: string[] }

type Outgoing =
  | { type: 'ready'; version: string }
  | { type: 'status'; text: string }
  | { type: 'stdout'; id: number; text: string }
  | { type: 'stderr'; id: number; text: string }
  | { type: 'plot'; id: number; png: string }
  | { type: 'result'; id: number; repr: string | null }
  | { type: 'error'; id: number; message: string }
  | { type: 'fatal'; message: string }

const post = (m: Outgoing) => (self as unknown as Worker).postMessage(m)

let pyodide: PyodideLike | null = null
let booting: Promise<PyodideLike> | null = null
let activeId = 0

/**
 * Matplotlib's `matplotlib-pyodide` backend was removed upstream and the new
 * default (`webagg`) wants a DOM, which a worker does not have. Agg plus an
 * explicit base64 flush is the only worker-safe path — and because `plt.show()`
 * is a harmless no-op under Agg, learner code written the normal way still
 * works; the figures simply appear when the cell finishes.
 */
const PRELUDE = `
import os, sys
os.environ["MPLBACKEND"] = "Agg"

def _orbit_post(payload):
    """Post a message to the main thread as a plain JS object.

    This indirection is load-bearing. Pyodide converts a Python dict handed to
    a JS function into a JS *Map*, not an object literal — so \`msg.type\`
    would be undefined on the other side and every plot would be silently
    dropped. \`dict_converter=Object.fromEntries\` is what produces a real
    object that structured-clones the way the worker protocol expects.
    """
    import js
    from pyodide.ffi import to_js
    js.postMessage(to_js(payload, dict_converter=js.Object.fromEntries))

def _orbit_flush_figures():
    if "matplotlib" not in sys.modules:
        return
    import io, base64
    import matplotlib.pyplot as plt
    for num in plt.get_fignums():
        fig = plt.figure(num)
        buf = io.BytesIO()
        fig.savefig(buf, format="png", dpi=112, bbox_inches="tight",
                    facecolor="#080b14", edgecolor="none")
        _orbit_post({
            "type": "plot",
            "id": _ORBIT_RUN_ID,
            "png": "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode(),
        })
        plt.close(fig)
`

async function boot(packages: string[] = []): Promise<PyodideLike> {
  if (pyodide) return pyodide
  if (booting) return booting

  booting = (async () => {
    post({ type: 'status', text: 'Downloading Python runtime (~7 MB, cached after this)…' })

    // A blocked CDN is by far the most likely failure here — a corporate proxy,
    // an ad blocker, or simply being offline on a first visit. The raw
    // "Failed to fetch dynamically imported module" is meaningless to a
    // learner, so translate it into something they can act on.
    let mod: { loadPyodide: (o: Record<string, unknown>) => Promise<PyodideLike> }
    try {
      mod = (await import(/* @vite-ignore */ PYODIDE_URL)) as typeof mod
    } catch {
      booting = null
      throw new Error(
        'Could not reach the Python runtime on cdn.jsdelivr.net. It is a one-time ~7 MB ' +
          'download, so this usually means you are offline or something is blocking that ' +
          'host. Everything else in the app works without it.',
      )
    }

    const py = await mod.loadPyodide({
      indexURL: `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`,
      env: { MPLBACKEND: 'Agg', HOME: '/home/pyodide' },
      packages,
    })

    py.setStdout({ batched: (text) => post({ type: 'stdout', id: activeId, text: `${text}\n` }) })
    py.setStderr({ batched: (text) => post({ type: 'stderr', id: activeId, text: `${text}\n` }) })

    await py.runPythonAsync(`_ORBIT_RUN_ID = 0\n${PRELUDE}`)

    pyodide = py
    post({ type: 'ready', version: PYODIDE_VERSION })
    return py
  })()

  return booting
}

self.onmessage = async (e: MessageEvent<Incoming>) => {
  const msg = e.data

  try {
    if (msg.cmd === 'init') {
      await boot(msg.packages)
      return
    }

    if (msg.cmd === 'run') {
      activeId = msg.id
      const py = await boot()

      // stdin is pre-supplied per exercise. A truly interactive prompt would
      // need Atomics.wait on a SharedArrayBuffer, i.e. COOP/COEP headers; a
      // queue covers every teaching case without that constraint.
      const lines = msg.stdin ?? []
      let cursor = 0
      py.setStdin({ stdin: () => (cursor < lines.length ? lines[cursor++]! : null) })

      if (msg.packages?.length) {
        post({ type: 'status', text: `Loading ${msg.packages.join(', ')}…` })
        await py.loadPackage(msg.packages)
      }
      // Anything imported that ships with the distribution is fetched on
      // demand, so a learner writing `import numpy` just works.
      await py.loadPackagesFromImports(msg.code)

      py.globals.set('_ORBIT_RUN_ID', msg.id)

      // Every run starts from an empty namespace, the way `python main.py`
      // does: nothing an earlier run defined can pass a check this one has
      // not earned.
      const scope = py.runPython('{"__name__": "__main__"}')
      let repr: string | null = null
      try {
        const result = await py.runPythonAsync(msg.code, { globals: scope })
        repr = result === undefined || result === null ? null : String(result)
        ;(result as { destroy?: () => void } | null)?.destroy?.()
      } finally {
        scope.destroy?.()
      }
      await py.runPythonAsync('_orbit_flush_figures()')

      post({ type: 'result', id: msg.id, repr })
    }
  } catch (err) {
    const message = err instanceof Error ? (err.message || String(err)) : String(err)
    if (msg.cmd === 'run') post({ type: 'error', id: msg.id, message })
    else post({ type: 'fatal', message })
  }
}

export {}
