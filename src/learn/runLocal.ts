/* Runs Learn problems on this machine, for the tests: Python on CPython, C++ on clang with the
   in-browser compiler's flags, SQL on the app's own sql.js (the version in lib/runtimes.ts, so query
   plans and error text are the browser's), Terminal and Git on the practice shell. Test-only: it
   spawns processes.

   With LEARN_CPP_WASM set to an installed @yowasp/clang, C++ is built by the app's own compiler for
   wasm32 and run under WASI instead, exactly as in the browser (slow: for a final sweep).
   With LEARN_PYODIDE set to an installed pyodide, Python runs on Pyodide instead, one interpreter per
   worker as in the app (standard library only: the extra packages come from a CDN). */
import { type ChildProcessWithoutNullStreams, spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { cpus, tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'
import { createInterface } from 'node:readline'
import { fileURLToPath } from 'node:url'
import { buildProgram, gradeRun, lessonShell, typeLines } from './grade'
import { gradedUnits } from './practice'
import type { LearnLesson, LearnRun, LearnTrack } from './types'

const dir = mkdtempSync(join(tmpdir(), 'orbit-solutions-'))
/** Removes the scratch folder: call from afterAll. */
export function cleanUp(): void {
  for (const c of compilers) c.proc.kill()
  rmSync(dir, { recursive: true, force: true })
}

// ---- C++ as the browser builds it (LEARN_CPP_WASM) -------------------------------------------
const HERE = dirname(fileURLToPath(import.meta.url))
const WASM = process.env.LEARN_CPP_WASM
type Compiler = { proc: ChildProcessWithoutNullStreams; waiting: Map<string, (r: { ok: boolean; diagnostics: string }) => void>; busy: number }
const compilers: Compiler[] = []

function compiler(): Compiler {
  const width = Math.max(1, Number(process.env.LEARN_CPP_WASM_JOBS) || 2)
  if (compilers.length < width) {
    const proc = spawn('node', [join(HERE, 'cppwasm.mjs')], { stdio: ['pipe', 'pipe', 'pipe'], env: process.env })
    const c: Compiler = { proc, waiting: new Map(), busy: 0 }
    createInterface({ input: proc.stdout }).on('line', (line) => {
      if (!line.startsWith('{')) return // a status line from the compiler package, not an answer
      const { id, ok, diagnostics } = JSON.parse(line) as { id: string; ok: boolean; diagnostics: string }
      c.waiting.get(id)?.({ ok, diagnostics })
      c.waiting.delete(id)
    })
    proc.stderr.on('data', () => {}) // the compiler's download progress
    compilers.push(c)
    return c
  }
  return compilers.reduce((a, b) => (b.busy < a.busy ? b : a))
}

async function runWasm(id: string, program: string, stdin: string): Promise<LearnRun> {
  const out = join(dir, `w${id}.wasm`)
  const c = compiler()
  c.busy++
  const built = await new Promise<{ ok: boolean; diagnostics: string }>((resolve) => {
    c.waiting.set(id, resolve)
    c.proc.stdin.write(`${JSON.stringify({ id, src: program, out })}\n`)
  })
  c.busy--
  if (!built.ok) return { stdout: '', stderr: built.diagnostics, error: built.diagnostics || 'did not compile', ms: 0 }
  const folder = join(dir, `f${id}`)
  mkdirSync(folder)
  const r = await exec('node', ['--no-warnings', join(HERE, 'wasirun.mjs'), out, folder], stdin, 20_000)
  return { stdout: r.stdout, stderr: r.stderr, error: r.code === 0 ? null : r.stderr.trim().split('\n').pop() || `exit ${r.code}`, ms: 0 }
}

// ---- Python on Pyodide (LEARN_PYODIDE) ---------------------------------------------------------
const PYODIDE = process.env.LEARN_PYODIDE
type PyAnswer = { stdout: string; stderr: string; error: string | null }
type Interpreter = { proc: ChildProcessWithoutNullStreams; reply: ((r: PyAnswer) => void) | null }
const idle: Interpreter[] = []
const queue: ((i: Interpreter) => void)[] = []
let interpreters = 0

function startInterpreter(): Interpreter {
  const proc = spawn('node', ['--no-warnings', join(HERE, 'pyodiderun.mjs')], { stdio: ['pipe', 'pipe', 'pipe'], env: process.env })
  const it: Interpreter = { proc, reply: null }
  createInterface({ input: proc.stdout }).on('line', (line) => {
    if (!line.startsWith('{')) return
    it.reply?.(JSON.parse(line) as PyAnswer)
  })
  proc.stderr.on('data', () => {})
  compilers.push({ proc, waiting: new Map(), busy: 0 }) // so cleanUp kills it
  return it
}

function interpreter(): Promise<Interpreter> {
  const free = idle.pop()
  if (free) return Promise.resolve(free)
  if (interpreters < Math.max(1, Number(process.env.LEARN_PYODIDE_JOBS) || Math.min(4, cpus().length))) {
    interpreters++
    return Promise.resolve(startInterpreter())
  }
  return new Promise((resolve) => queue.push(resolve))
}

function release(it: Interpreter): void {
  const next = queue.shift()
  if (next) next(it)
  else idle.push(it)
}

/** A run that goes past 30 seconds is stopped the only way a busy interpreter can be: a new one. */
async function runPyodide(id: string, code: string, stdin: string): Promise<LearnRun> {
  let it = await interpreter()
  const r = await new Promise<PyAnswer>((resolve) => {
    const timer = setTimeout(() => {
      it.proc.kill('SIGKILL')
      it = startInterpreter()
      resolve({ stdout: '', stderr: 'timed out', error: 'timed out after 30 s' })
    }, 30_000 + 20_000) // the first run on an interpreter also loads Pyodide
    it.reply = (answer) => {
      clearTimeout(timer)
      resolve(answer)
    }
    it.proc.stdin.write(`${JSON.stringify({ id, code, stdin })}\n`)
  })
  it.reply = null
  release(it)
  return { stdout: r.stdout, stderr: r.stderr, error: r.error, ms: 0 }
}

function exec(cmd: string, args: string[], stdin: string, ms: number, cwd?: string): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'], ...(cwd ? { cwd } : {}) })
    let stdout = ''
    let stderr = ''
    const timer = setTimeout(() => p.kill('SIGKILL'), ms)
    p.stdout.on('data', (d) => (stdout += d))
    p.stderr.on('data', (d) => (stderr += d))
    p.on('close', (code) => {
      clearTimeout(timer)
      resolve({ code, stdout, stderr })
    })
    p.stdin.on('error', () => {}) // a program that exits without reading its input
    p.stdin.end(stdin)
  })
}

// ---- SQL on the browser's own sql.js ----------------------------------------------------------
type SqlJs = { Database: new () => { run(sql: string): void; exec(sql: string): { columns: string[]; values: unknown[][] }[]; close(): void } }
let sqlJs: Promise<SqlJs> | null = null
/** The same steps as runSql in lib/runtimes.ts: a fresh database, the schema, then the program. */
async function runSql(schema: string, program: string): Promise<LearnRun> {
  sqlJs ??= (createRequire(import.meta.url)('sql.js') as () => Promise<SqlJs>)()
  const SQL = await sqlJs
  const db = new SQL.Database()
  try {
    if (schema) db.run(schema)
    const out = db.exec(program)
    return { stdout: '', stderr: '', error: null, tables: out.map((t) => ({ columns: t.columns, rows: t.values as NonNullable<LearnRun['tables']>[number]['rows'] })), ms: 0 }
  } catch (e) {
    return { stdout: '', stderr: '', error: e instanceof Error ? e.message : String(e), tables: [], ms: 0 }
  } finally {
    db.close()
  }
}

// Pyodide runs a program with top-level await (an asyncio lesson awaits at the top); CPython needs asking.
const PY_FILE = join(dir, 'py.py')
writeFileSync(
  PY_FILE,
  String.raw`
import ast, asyncio, sys
path = sys.argv[1]
sys.argv = ['main.py']
code = compile(open(path).read(), 'main.py', 'exec', flags=ast.PyCF_ALLOW_TOP_LEVEL_AWAIT)
result = eval(code, {'__name__': '__main__'})
if asyncio.iscoroutine(result):
    asyncio.run(result)
`,
)

let n = 0
export async function run(lesson: LearnLesson, code: string): Promise<LearnRun> {
  const program = buildProgram(lesson, code)
  const id = `${n++}`
  if (lesson.lang === 'python' && PYODIDE) return runPyodide(id, program, lesson.stdin ?? '')
  if (lesson.lang === 'python') {
    const file = join(dir, `p${id}.py`)
    writeFileSync(file, program)
    const r = await exec('python3', ['-I', PY_FILE, file], lesson.stdin ?? '', 30_000)
    return { stdout: r.stdout, stderr: r.stderr, error: r.code === 0 ? null : r.stderr.trim().split('\n').pop() || `exit ${r.code}`, ms: 0 }
  }
  if (lesson.lang === 'cpp' && WASM) return runWasm(id, program, lesson.stdin ?? '')
  if (lesson.lang === 'cpp') {
    const src = join(dir, `c${id}.cpp`)
    const bin = join(dir, `c${id}`)
    writeFileSync(src, program)
    const built = await exec('clang++', ['-std=c++20', '-O1', '-w', '-fno-exceptions', src, '-o', bin], '', 120_000)
    if (built.code !== 0) return { stdout: '', stderr: built.stderr, error: built.stderr || 'did not compile', ms: 0 }
    // Each run starts in an empty folder of its own, as in the app: files a program writes stay there.
    const folder = join(dir, `f${id}`)
    mkdirSync(folder)
    const r = await exec(bin, [], lesson.stdin ?? '', 20_000, folder)
    return { stdout: r.stdout, stderr: r.stderr, error: r.code === 0 ? null : `exit ${r.code}`, ms: 0 }
  }
  if (lesson.lang === 'sql') return runSql(lesson.schema ?? '', program)
  if (lesson.lang === 'bash' || lesson.lang === 'git') {
    // Nothing is typed until she types it: a terminal problem's "starter" is the empty prompt.
    const start = lessonShell(lesson)
    return { stdout: '', stderr: '', error: null, shell: code === lesson.solution ? typeLines(start, code) : start, ms: 0 }
  }
  throw new Error(`no runner for ${lesson.lang}`)
}

/** Runs tasks a few at a time: compiling hundreds of C++ programs one by one takes too long. */
export async function pool<T, R>(items: T[], width: number, f: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let next = 0
  await Promise.all(
    Array.from({ length: width }, async () => {
      while (next < items.length) {
        const i = next++
        out[i] = await f(items[i]!)
      }
    }),
  )
  return out
}

export const RUNNABLE = new Set(['python', 'cpp', 'sql', 'bash', 'git'])

/** Which problems this run checks: all of them, or with LEARN_SHARD=k/n every n-th, starting at the k-th. */
export function shardOf(spec = process.env.LEARN_SHARD): <T>(items: T[]) => T[] {
  if (!spec) return (items) => items
  const m = /^(\d+)\/(\d+)$/.exec(spec)
  const k = Number(m?.[1])
  const n = Number(m?.[2])
  if (!m || n < 1 || k < 1 || k > n) throw new Error(`LEARN_SHARD must look like 2/3, not "${spec}"`)
  return (items) => items.filter((_, i) => i % n === k - 1)
}

/** Every problem in these courses that cannot be solved, or needs no solving: empty when all is well. */
export async function unsolvable(tracks: LearnTrack[]): Promise<string[]> {
  const units = shardOf()(tracks.filter((t) => RUNNABLE.has(t.lang)).flatMap((t) => t.lessons.flatMap(gradedUnits)))
  const problems = await pool(units, Math.max(2, cpus().length), async (u) => {
    const started = Date.now()
    const solved = gradeRun(u, u.solution, await run(u, u.solution))
    // LEARN_TIMING=5 lists every solution that took longer than 5 seconds: the app stops a check at 30.
    const slow = Number(process.env.LEARN_TIMING)
    if (slow && Date.now() - started > slow * 1000) console.log(`slow: ${u.id} ${((Date.now() - started) / 1000).toFixed(1)} s`)
    const failing = solved.results.filter((r) => r.status === 'fail').map((r) => `${r.name}: ${r.detail ?? r.actual ?? ''}`.slice(0, 200))
    const out: string[] = []
    if (failing.length) out.push(`${u.id}: the solution fails ${failing.join(' | ')}${solved.error ? ` (error: ${solved.error.slice(0, 200)})` : ''}`)
    // The browser-runtime sweeps prove solutions; starters were already proved on the native build.
    if ((WASM && u.lang === 'cpp') || (PYODIDE && u.lang === 'python')) return out
    const unsolved = gradeRun(u, u.starter, await run(u, u.starter))
    if (unsolved.passed) out.push(`${u.id}: the starter already passes`)
    return out
  })
  return problems.flat()
}

export function unitCount(tracks: LearnTrack[]): number {
  return shardOf()(tracks.filter((t) => RUNNABLE.has(t.lang)).flatMap((t) => t.lessons.flatMap(gradedUnits))).length
}
