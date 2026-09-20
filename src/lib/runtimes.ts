/* ============================================================================
   ORBIT — language runtimes
   ----------------------------------------------------------------------------
   What can and cannot actually run in a browser, stated plainly rather than
   papered over:

     Python  real execution, Pyodide in a module worker, full scientific stack
     SQL     real execution, SQLite compiled to WebAssembly
     C++     no client-side compiler exists that is worth 95MB of download, so
             submissions are checked against expected output
     Rust    there is no rustc-in-WASM at all; same treatment
     MATLAB  proprietary and never going to run here; taught with a NumPy
             equivalence bridge so the ideas transfer even though the syntax
             cannot execute

   The UI says which mode an exercise is in. Pretending a C++ exercise ran when
   it was string-compared would be worse than useless — a learner would trust a
   green tick that means nothing.
   ========================================================================== */
import type { Lang } from '@/curriculum/types'

export type RunMode = 'execute' | 'check' | 'reference'

export interface LangInfo {
  id: Lang
  label: string
  mode: RunMode
  /** Shown under the run button so nobody is misled about what just happened. */
  note: string
}

export const LANGS: Record<Lang, LangInfo> = {
  python: {
    id: 'python',
    label: 'Python',
    mode: 'execute',
    note: 'Runs for real — CPython 3.14 compiled to WebAssembly, with NumPy, SciPy, SymPy, pandas and Matplotlib available on demand.',
  },
  sql: {
    id: 'sql',
    label: 'SQL',
    mode: 'execute',
    note: 'Runs for real against SQLite compiled to WebAssembly. Each exercise gets a fresh in-memory database seeded from its own schema.',
  },
  cpp: {
    id: 'cpp',
    label: 'C++',
    mode: 'check',
    note: 'Not compiled here — no browser-side C++ toolchain is small enough to ship. Your output is compared against the expected result, and the reference solution is one click away.',
  },
  rust: {
    id: 'rust',
    label: 'Rust',
    mode: 'check',
    note: 'Not compiled here — there is no Rust compiler that runs in a browser. Your output is compared against the expected result.',
  },
  matlab: {
    id: 'matlab',
    label: 'MATLAB',
    mode: 'reference',
    note: 'MATLAB is proprietary and cannot run in a browser. Every MATLAB exercise ships a NumPy equivalent you can run side by side — the operations map almost one to one.',
  },
  simulink: {
    id: 'simulink',
    label: 'Simulink',
    mode: 'reference',
    note: 'Model-based design work happens in Simulink itself. What is here is the block diagram, the solver settings and what to verify.',
  },
  bash: {
    id: 'bash',
    label: 'Shell',
    mode: 'check',
    note: 'Not executed — shell exercises are checked against expected output.',
  },
  text: {
    id: 'text',
    label: 'Notes',
    mode: 'reference',
    note: 'Free-form notes — nothing here is executed or checked. Use it for derivations, working and anything you want to keep with the module.',
  },
}

/* ── Python ──────────────────────────────────────────────────────────────── */

export interface RunOutput {
  stdout: string
  stderr: string
  plots: string[]
  result: string | null
  error: string | null
  ms: number
}

export type StatusFn = (text: string) => void

/**
 * A single Pyodide worker, created lazily and reused.
 *
 * Cancellation terminates the worker outright. That throws away a ~7 second
 * boot, but the alternative (an interrupt buffer) requires cross-origin
 * isolation the deploy target cannot guarantee, and an uncancellable infinite
 * loop is a far worse outcome than a slow restart.
 */
class PythonRuntime {
  private worker: Worker | null = null
  private nextId = 1
  private pending: {
    id: number
    resolve: (o: RunOutput) => void
    out: RunOutput
    startedAt: number
  } | null = null
  private onStatus: StatusFn | null = null
  private booted = false

  get isBooted(): boolean {
    return this.booted
  }

  private ensure(): Worker {
    if (this.worker) return this.worker
    const w = new Worker(new URL('../workers/python.worker.ts', import.meta.url), {
      type: 'module',
    })
    w.onmessage = (e: MessageEvent) => this.handle(e.data)
    w.onerror = () => {
      this.fail('The Python runtime failed to start. Check your network connection and reload.')
    }
    this.worker = w
    return w
  }

  private handle(msg: Record<string, unknown>): void {
    const type = msg.type as string

    if (type === 'status') {
      this.onStatus?.(String(msg.text))
      return
    }
    if (type === 'ready') {
      this.booted = true
      this.onStatus?.('')
      return
    }
    if (type === 'fatal') {
      this.fail(String(msg.message))
      return
    }

    const p = this.pending
    if (!p || msg.id !== p.id) return

    switch (type) {
      case 'stdout':
        p.out.stdout += String(msg.text)
        break
      case 'stderr':
        p.out.stderr += String(msg.text)
        break
      case 'plot':
        p.out.plots.push(String(msg.png))
        break
      case 'result':
        p.out.result = msg.repr == null ? null : String(msg.repr)
        this.settle()
        break
      case 'error':
        p.out.error = String(msg.message)
        this.settle()
        break
    }
  }

  private settle(): void {
    const p = this.pending
    if (!p) return
    this.pending = null
    p.out.ms = Date.now() - p.startedAt
    p.resolve(p.out)
  }

  private fail(message: string): void {
    const p = this.pending
    this.pending = null
    this.booted = false
    this.worker?.terminate()
    this.worker = null
    if (p) {
      p.out.error = message
      p.out.ms = Date.now() - p.startedAt
      p.resolve(p.out)
    } else {
      this.onStatus?.(message)
    }
  }

  /** Starts downloading the runtime without running anything. */
  preload(onStatus?: StatusFn): void {
    if (onStatus) this.onStatus = onStatus
    this.ensure().postMessage({ cmd: 'init' })
  }

  run(
    code: string,
    opts: { stdin?: string[]; packages?: string[]; onStatus?: StatusFn } = {},
  ): Promise<RunOutput> {
    if (opts.onStatus) this.onStatus = opts.onStatus
    if (this.pending) this.cancel()

    const w = this.ensure()
    const id = this.nextId++

    return new Promise<RunOutput>((resolve) => {
      this.pending = {
        id,
        resolve,
        startedAt: Date.now(),
        out: { stdout: '', stderr: '', plots: [], result: null, error: null, ms: 0 },
      }
      w.postMessage({ cmd: 'run', id, code, stdin: opts.stdin, packages: opts.packages })
    })
  }

  /** Kills the worker. The next run pays the boot cost again. */
  cancel(): void {
    const p = this.pending
    this.pending = null
    this.worker?.terminate()
    this.worker = null
    this.booted = false
    if (p) {
      p.out.error = 'Stopped.'
      p.out.ms = Date.now() - p.startedAt
      p.resolve(p.out)
    }
  }
}

export const python = new PythonRuntime()

/* ── SQL ─────────────────────────────────────────────────────────────────────
   sql.js, on the main thread rather than in a worker.

   That is a deliberate exception to the "heavy work goes in a worker" rule:
   the runtime is 700KB rather than 13MB, and the queries a SQL lesson runs are
   over tables of a few dozen rows. Moving it to a worker would buy protection
   against a pathological cartesian join and cost a message-passing layer for
   every result set. The UI cost of being wrong here is a few milliseconds. */

const SQLJS_VERSION = '1.14.2'
const SQLJS_BASE = `https://cdn.jsdelivr.net/npm/sql.js@${SQLJS_VERSION}/dist/`

interface SqlJsDatabase {
  run(sql: string): void
  exec(sql: string): { columns: string[]; values: unknown[][] }[]
  close(): void
}

interface SqlJsStatic {
  Database: new (data?: Uint8Array) => SqlJsDatabase
}

declare global {
  interface Window {
    initSqlJs?: (cfg: { locateFile: (f: string) => string }) => Promise<SqlJsStatic>
  }
}

let sqlPromise: Promise<SqlJsStatic> | null = null

function loadSqlJs(): Promise<SqlJsStatic> {
  if (sqlPromise) return sqlPromise

  sqlPromise = new Promise<SqlJsStatic>((resolve, reject) => {
    // sql.js ships as UMD, so a script tag is the path of least resistance;
    // importing it as ESM fights the bundler over its .wasm sidecar.
    const existing = window.initSqlJs
    if (existing) {
      void existing({ locateFile: (f) => SQLJS_BASE + f }).then(resolve, reject)
      return
    }

    const s = document.createElement('script')
    s.src = `${SQLJS_BASE}sql-wasm.js`
    s.async = true
    s.onload = () => {
      if (!window.initSqlJs) {
        reject(new Error('sql.js loaded but did not register itself.'))
        return
      }
      window
        .initSqlJs({ locateFile: (f) => SQLJS_BASE + f })
        .then(resolve)
        .catch(reject)
    }
    s.onerror = () =>
      reject(
        new Error(
          'Could not reach the SQLite runtime on cdn.jsdelivr.net. It is a one-time ~700 KB ' +
            'download — check your connection, or whether something is blocking that host.',
        ),
      )
    document.head.appendChild(s)
  }).catch((e) => {
    sqlPromise = null
    throw e
  })

  return sqlPromise
}

export interface SqlResult {
  tables: { columns: string[]; rows: unknown[][] }[]
  error: string | null
  ms: number
}

/**
 * Runs SQL against a fresh in-memory database seeded with `schema`.
 *
 * Fresh every time is the right call for teaching: an exercise that depends on
 * whatever the previous one left behind is not reproducible, and a learner who
 * breaks their table should be one re-run away from a clean slate.
 */
export async function runSql(sql: string, schema?: string): Promise<SqlResult> {
  const started = Date.now()
  try {
    const SQL = await loadSqlJs()
    const db = new SQL.Database()
    try {
      if (schema) db.run(schema)
      const out = db.exec(sql)
      return {
        tables: out.map((t) => ({ columns: t.columns, rows: t.values })),
        error: null,
        ms: Date.now() - started,
      }
    } finally {
      db.close()
    }
  } catch (e) {
    return {
      tables: [],
      error: e instanceof Error ? e.message : String(e),
      ms: Date.now() - started,
    }
  }
}

/* ── Output checking (C++, Rust, shell) ──────────────────────────────────── */

export interface CheckResult {
  pass: boolean
  detail: string
}

/**
 * Compares a learner's stated output against the expected one, normalising
 * trailing whitespace and line endings but nothing else. Being lenient about
 * significant whitespace would hide real bugs.
 */
export function checkOutput(actual: string, expected: string): CheckResult {
  const norm = (s: string) =>
    s
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((l) => l.replace(/\s+$/, ''))
      .join('\n')
      .replace(/\n+$/, '')

  const a = norm(actual)
  const b = norm(expected)
  if (a === b) return { pass: true, detail: 'Output matches.' }

  const al = a.split('\n')
  const bl = b.split('\n')
  for (let i = 0; i < Math.max(al.length, bl.length); i++) {
    if (al[i] !== bl[i]) {
      return {
        pass: false,
        detail: `First difference on line ${i + 1}:\n  expected: ${bl[i] ?? '(nothing)'}\n  actual:   ${al[i] ?? '(nothing)'}`,
      }
    }
  }
  return { pass: false, detail: 'Output differs.' }
}

/**
 * Builds the Python source for a test run: the learner's code, then each
 * assertion. Assertions are appended rather than run separately so they see
 * the learner's own definitions.
 */
export function buildTestProgram(code: string, tests: { name: string; assert: string }[]): string {
  const harness = tests
    .map(
      (t, i) => `
try:
${indent(t.assert, 4)}
    print("PASS ${i}: ${escape(t.name)}")
except AssertionError as _e:
    print("FAIL ${i}: ${escape(t.name)} — " + (str(_e) or "assertion failed"))
except Exception as _e:
    print("ERROR ${i}: ${escape(t.name)} — " + type(_e).__name__ + ": " + str(_e))
`,
    )
    .join('')

  return `${code}\n\nprint("__ORBIT_TESTS__")\n${harness}`
}

export interface TestOutcome {
  name: string
  status: 'pass' | 'fail' | 'error'
  message?: string
}

export function parseTestOutput(
  stdout: string,
  tests: { name: string }[],
): { userOutput: string; outcomes: TestOutcome[] } {
  const marker = '__ORBIT_TESTS__'
  const at = stdout.indexOf(marker)
  const userOutput = at >= 0 ? stdout.slice(0, at) : stdout
  const tail = at >= 0 ? stdout.slice(at + marker.length) : ''

  const outcomes: TestOutcome[] = tests.map((t) => ({ name: t.name, status: 'error' as const }))
  for (const line of tail.split('\n')) {
    const m = /^(PASS|FAIL|ERROR) (\d+): (.*)$/.exec(line.trim())
    if (!m) continue
    const idx = Number(m[2])
    const entry = outcomes[idx]
    if (!entry) continue
    entry.status = m[1] === 'PASS' ? 'pass' : m[1] === 'FAIL' ? 'fail' : 'error'
    const rest = m[3] ?? ''
    const dash = rest.indexOf('—')
    if (dash >= 0) entry.message = rest.slice(dash + 1).trim()
  }
  return { userOutput, outcomes }
}

function indent(s: string, n: number): string {
  const pad = ' '.repeat(n)
  return s
    .split('\n')
    .map((l) => pad + l)
    .join('\n')
}

function escape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}
