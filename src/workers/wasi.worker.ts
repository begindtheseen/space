/// <reference lib="webworker" />
/* ============================================================================
   ORBIT — WASI program runner (module worker, one per run)
   ----------------------------------------------------------------------------
   Runs a program the C++ worker compiled. It gets standard input (whatever
   the learner typed in the input box), standard output and error, the clock
   and random numbers — the parts of WASI a console program uses — and no
   files and no network.

   Like the JavaScript runtime, the worker is thrown away after every run, so
   a loop that never ends is stopped by terminating it.
   ========================================================================== */
import { ConsoleStdout, File, OpenFile, PreopenDirectory, WASI } from '@bjorn3/browser_wasi_shim'

const post = (m: Record<string, unknown>) => (self as unknown as Worker).postMessage(m)

function stream(type: 'stdout' | 'stderr', id: number) {
  const decoder = new TextDecoder()
  return new ConsoleStdout((bytes: Uint8Array) => {
    post({ type, id, text: decoder.decode(bytes, { stream: true }) })
  })
}

self.onmessage = async (e: MessageEvent) => {
  const { cmd, id, wasm, stdin } = e.data as { cmd: string; id: number; wasm: ArrayBuffer; stdin?: string }
  if (cmd !== 'run') return

  const wasi = new WASI(
    ['main'],
    [],
    [
      new OpenFile(new File(new TextEncoder().encode(stdin ?? ''))),
      stream('stdout', id),
      stream('stderr', id),
      new PreopenDirectory('.', new Map()),
    ],
  )

  try {
    const module = await WebAssembly.compile(wasm)
    const instance = await WebAssembly.instantiate(module, { wasi_snapshot_preview1: wasi.wasiImport })
    const code = wasi.start(instance as unknown as { exports: { memory: WebAssembly.Memory; _start: () => unknown } })
    post({ type: 'exit', id, code })
  } catch (err) {
    // A trap: abort(), a failed assert, dividing by zero, or reaching memory
    // the program does not own. With exceptions off, an out-of-range .at()
    // or a failed allocation ends here too.
    const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
    post({ type: 'trap', id, message })
  }
}
