/* Test-only: compiles C++ with the same compiler the app uses in the tab (YoWASP clang, built for
   wasm32-wasi), so the solutions check can prove a program behaves the same in the browser, where
   `long`, `size_t` and pointers are 4 bytes.

   One process stays up and compiles job after job: loading the compiler takes far longer than
   using it. Jobs arrive as JSON lines on stdin, { id, src, out }, and each answer is one JSON line,
   { id, ok, diagnostics }. The compiler package is found through LEARN_CPP_WASM, the path to an
   installed @yowasp/clang (the version in workers/cpp.worker.ts). */
import { writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { pathToFileURL } from 'node:url'

// Standard output carries only the answers: anything the compiler package logs goes to standard error.
console.log = (...args) => console.error(...args)
console.info = console.log

const pkg = process.env.LEARN_CPP_WASM
if (!pkg) {
  process.stderr.write('LEARN_CPP_WASM is not set\n')
  process.exit(2)
}
const { runClang } = await import(pathToFileURL(`${pkg}/gen/bundle.js`).href)

// The flags in lib/cppRemote.ts (CXX_FLAGS), with warnings off: only errors matter here.
const FLAGS = ['-std=c++20', '-O1', '-w', '-fno-exceptions', '-fno-color-diagnostics']

const lines = createInterface({ input: process.stdin })
for await (const line of lines) {
  if (!line.trim()) continue
  const { id, src, out } = JSON.parse(line)
  let diagnostics = ''
  const decoder = new TextDecoder()
  const collect = (bytes) => {
    diagnostics += bytes ? decoder.decode(bytes, { stream: true }) : decoder.decode()
  }
  let ok = false
  try {
    const files = await runClang(['clang++', ...FLAGS, 'main.cpp', '-o', 'main.wasm'], { 'main.cpp': src }, { stdout: collect, stderr: collect })
    const wasm = files['main.wasm']
    if (wasm instanceof Uint8Array) {
      writeFileSync(out, wasm)
      ok = true
    }
  } catch (err) {
    diagnostics += `\n${err instanceof Error ? err.message : String(err)}`
  }
  process.stdout.write(`${JSON.stringify({ id, ok, diagnostics: diagnostics.trim() })}\n`)
}
