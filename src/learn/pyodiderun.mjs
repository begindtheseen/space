/* Test-only: runs Python programs on Pyodide, the runtime the app runs Python on in the tab, so the
   solutions check can prove a problem behaves the same in the browser as on CPython.

   One process stays up and runs job after job, as the app's worker does: one interpreter, a fresh
   `__main__` namespace per run, top-level await allowed. Jobs arrive as JSON lines on stdin,
   { id, code, stdin }, and each answer is one JSON line, { id, stdout, stderr, error }. The package
   is found through LEARN_PYODIDE, the path to a Pyodide distribution of the version in
   workers/python.worker.ts. Packages load from a program's imports, as in the worker, so NumPy,
   SciPy and the rest need the full distribution (the release archive), not the npm package, which
   carries only the standard library. */
import { createInterface } from 'node:readline'
import { pathToFileURL } from 'node:url'

// Standard output carries only the answers: anything Pyodide logs goes to standard error.
const answer = process.stdout.write.bind(process.stdout)
console.log = (...args) => console.error(...args)
console.info = console.log
console.warn = console.log

const pkg = process.env.LEARN_PYODIDE
if (!pkg) {
  process.stderr.write('LEARN_PYODIDE is not set\n')
  process.exit(2)
}
const { loadPyodide } = await import(pathToFileURL(`${pkg}/pyodide.mjs`).href)
const py = await loadPyodide({ env: { MPLBACKEND: 'Agg', HOME: '/home/pyodide' } })
await py.runPythonAsync('import os, sys\nos.environ["MPLBACKEND"] = "Agg"\n_ORBIT_RUN_ID = 0')

// As workers/python.worker.ts does: loading messages kept out of the program's output, and an
// `__import__("name")` in a check counted as an import.
const quiet = { messageCallback: () => {}, errorCallback: (text) => (err += `${text}\n`) }
function importsOf(code) {
  const dynamic = [...code.matchAll(/__import__\(\s*["']([A-Za-z_][\w.]*)["']/g)].map((m) => `import ${m[1]}`)
  return dynamic.length ? `${code}\n${dynamic.join('\n')}\n` : code
}

let out = ''
let err = ''
py.setStdout({ batched: (text) => (out += `${text}\n`) })
py.setStderr({ batched: (text) => (err += `${text}\n`) })

const lines = createInterface({ input: process.stdin })
for await (const line of lines) {
  if (!line.trim()) continue
  const { id, code, stdin } = JSON.parse(line)
  out = ''
  err = ''
  const input = (stdin ?? '').split('\n')
  if (input.at(-1) === '') input.pop()
  let cursor = 0
  py.setStdin({ stdin: () => (cursor < input.length ? input[cursor++] : null) })
  let error = null
  try {
    await py.loadPackagesFromImports(importsOf(code), quiet)
    const scope = py.runPython('{"__name__": "__main__"}')
    try {
      await py.runPythonAsync(code, { globals: scope })
    } finally {
      scope.destroy?.()
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    err += message
    error = message.trim().split('\n').pop() || 'error'
  }
  answer(`${JSON.stringify({ id, stdout: out, stderr: err, error })}\n`)
}
