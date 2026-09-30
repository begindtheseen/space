/* Test-only: runs a program cppwasm.mjs compiled, the way workers/wasi.worker.ts runs it in the app:
   standard input, output and error, and one empty folder the program may write files into. A trap
   (abort, a failed assert, reaching memory it does not own) ends the run with status 134.

   Usage: node wasirun.mjs main.wasm folder */
import { readFileSync } from 'node:fs'
import { WASI } from 'node:wasi'

const [file, folder] = process.argv.slice(2)
const wasi = new WASI({
  version: 'preview1',
  args: ['main'],
  env: {},
  preopens: { '.': folder },
  returnOnExit: true,
})
try {
  const module = await WebAssembly.compile(readFileSync(file))
  const instance = await WebAssembly.instantiate(module, wasi.getImportObject())
  process.exitCode = wasi.start(instance)
} catch (err) {
  process.stderr.write(`trap: ${err instanceof Error ? `${err.name}: ${err.message}` : String(err)}\n`)
  process.exitCode = 134
}
