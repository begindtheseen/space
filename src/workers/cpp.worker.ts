/// <reference lib="webworker" />
/* ============================================================================
   ORBIT — C++ compiler in the browser (module worker)
   ----------------------------------------------------------------------------
   Real clang++ and lld, compiled to WebAssembly (the YoWASP build of LLVM),
   running inside this worker. The desktop app still prefers the compiler on
   the Mac when one is installed; this is what runs everywhere else — in a
   browser, or on a Mac with no compiler yet — so C++ always really runs. It turns the learner's source into a WASI
   program, which the run worker then executes. Nothing is uploaded: the
   compiler comes to the browser, the code does not go to a server.

   The compiler is large — about 105 MB before compression — so it is fetched
   once, from a CDN, the first time someone presses Run on C++, and the
   browser caches it from then on. The worker is kept alive between runs so
   the second compile does not pay for loading it again; a program that never
   ends is stopped by terminating the *run* worker, never this one.

   One limit, stated rather than hidden: the C++ standard library in this
   toolchain is built without exception support, so the code is compiled with
   -fno-exceptions. `throw` and `try` are compile errors here; everything else
   in the standard library — containers, algorithms, strings, streams, smart
   pointers, <cmath> — works.
   ========================================================================== */

const CLANG_VERSION = '22.0.0-git20542-10'

/** Tried in order: the same package, byte for byte, from two CDNs. */
const MIRRORS = [
  `https://cdn.jsdelivr.net/npm/@yowasp/clang@${CLANG_VERSION}/gen/bundle.js`,
  `https://unpkg.com/@yowasp/clang@${CLANG_VERSION}/gen/bundle.js`,
]

/** The flags every compile uses. C++20, warnings on, exceptions off (see above). */
const CXX_FLAGS = ['-std=c++20', '-O1', '-Wall', '-Wextra', '-fno-exceptions', '-fno-color-diagnostics']

type Tree = { [name: string]: Tree | string | Uint8Array }
type RunOptions = {
  stdout?: ((bytes: Uint8Array | null) => void) | null
  stderr?: ((bytes: Uint8Array | null) => void) | null
  fetchProgress?: (e: { totalLength: number; doneLength: number }) => void
}
type RunClang = (args: string[], files: Tree, options?: RunOptions) => Promise<Tree>

const post = (m: Record<string, unknown>, transfer: Transferable[] = []) =>
  (self as unknown as Worker).postMessage(m, transfer)

let compiler: Promise<RunClang> | null = null

function load(): Promise<RunClang> {
  compiler ??= (async () => {
    let lastError: unknown = null
    for (const url of MIRRORS) {
      try {
        const mod = (await import(/* @vite-ignore */ url)) as { runClang: RunClang }
        return mod.runClang
      } catch (err) {
        lastError = err
      }
    }
    compiler = null // let the next Run try again rather than caching a failure
    throw new Error(
      'Could not download the C++ compiler from cdn.jsdelivr.net or unpkg.com. It is a one-time download ' +
        '(about 105 MB before compression) that the browser keeps afterwards — reconnect and press Run again.' +
        (lastError instanceof Error ? ` (${lastError.message})` : ''),
    )
  })()
  return compiler
}

self.onmessage = async (e: MessageEvent) => {
  const { cmd, id, source } = e.data as { cmd: string; id: number; source?: string }

  if (cmd === 'preload') {
    load().catch(() => {})
    return
  }
  if (cmd !== 'compile') return

  const decoder = new TextDecoder()
  let diagnostics = ''
  const collect = (bytes: Uint8Array | null) => {
    diagnostics += bytes ? decoder.decode(bytes, { stream: true }) : decoder.decode()
  }

  let runClang: RunClang
  try {
    post({ type: 'status', id, text: 'Loading the C++ compiler…' })
    runClang = await load()
  } catch (err) {
    post({ type: 'failed', id, stage: 'load', diagnostics: err instanceof Error ? err.message : String(err) })
    return
  }

  let lastPct = -1
  try {
    post({ type: 'status', id, text: 'Compiling…' })
    const out = await runClang(
      ['clang++', ...CXX_FLAGS, 'main.cpp', '-o', 'main.wasm'],
      { 'main.cpp': source ?? '' },
      {
        stdout: collect,
        stderr: collect,
        fetchProgress: ({ totalLength, doneLength }) => {
          const pct = totalLength ? Math.floor((doneLength / totalLength) * 100) : 0
          if (pct !== lastPct && pct < 100) {
            lastPct = pct
            post({ type: 'status', id, text: `Downloading the C++ compiler (first run only)… ${pct}%` })
          }
        },
      },
    )
    const wasm = out['main.wasm']
    if (!(wasm instanceof Uint8Array)) {
      post({ type: 'failed', id, stage: 'compile', diagnostics: diagnostics || 'The compiler produced no program.' })
      return
    }
    const bytes = wasm.slice().buffer
    post({ type: 'compiled', id, wasm: bytes, diagnostics }, [bytes])
  } catch (err) {
    // A compile error arrives as an Exit with a non-zero code; its message
    // is already in `diagnostics`, which is what the learner needs to read.
    // Anything that is not clang exiting — the compiler's own download or
    // start failing inside this call, as on iPhone, where the 75 MB module
    // cannot be compiled — is the compiler not loading, not her code.
    const exit = err as { code?: number; message?: string }
    const stage = typeof exit.code === 'number' ? 'compile' : 'load'
    if (stage === 'load') compiler = null
    post({
      type: 'failed',
      id,
      stage,
      diagnostics: stage === 'compile' ? diagnostics || exit.message || String(err) : `The C++ compiler could not start here (${exit.message || String(err)}).`,
    })
  }
}
