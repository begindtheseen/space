/* ============================================================================
   ORBIT — language runtimes
   ----------------------------------------------------------------------------
   What can and cannot actually run in a browser, stated plainly rather than
   papered over:

     Python  real execution, Pyodide in a module worker, full scientific stack
     SQL     real execution, SQLite compiled to WebAssembly
     C, C++  no browser compiler is worth tens of megabytes of download, but
             the desktop shell has the machine underneath it: clang or gcc is
             used when installed, and the exercise really compiles and runs
     Rust    no rustc-in-WASM exists at all; rustc is used the same way
     Shell   run by the machine's own bash
     MATLAB  proprietary, but Octave runs the same language and is free, so
             Octave is used when installed; the NumPy bridge stays for when
             it is not
     JS      run by the shell's own Node

   Everything but Python and SQL therefore depends on the desktop shell and on
   what is installed. `capabilityOf` answers that per language at the moment
   she presses run, and the UI states the answer rather than guessing.

   The rule underneath all of it: never show a green tick that does not mean
   what it appears to mean. An exercise that was string-compared says so, and
   a missing compiler says which one and how to install it.
   ========================================================================== */
import type { Lang } from '@/curriculum/types'
import { getOrbit, hasNativeRunner, isDesktop, type RunRequest, type RunResult, type ToolchainInfo } from './desktop'

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
    note: 'Compiled and run for real by the compiler on this Mac. Without one installed, your output is compared against the expected result instead.',
  },
  rust: {
    id: 'rust',
    label: 'Rust',
    mode: 'check',
    note: 'Compiled and run for real by rustc on this Mac. Without it installed, your output is compared against the expected result instead.',
  },
  matlab: {
    id: 'matlab',
    label: 'MATLAB',
    mode: 'reference',
    note: 'Run for real by GNU Octave when it is installed — same language, no licence. Otherwise every MATLAB exercise ships a NumPy equivalent you can run side by side.',
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
    note: 'Run for real by this machine\u2019s own bash, in a scratch directory that is thrown away afterwards.',
  },
  text: {
    id: 'text',
    label: 'Notes',
    mode: 'reference',
    note: 'Free-form notes — nothing here is executed or checked. Use it for derivations, working and anything you want to keep with the module.',
  },
}

/* ── What can actually run, right now ────────────────────────────────────── */

/**
 * Which language ids the desktop runner knows how to build and execute. The
 * key is the app's `Lang`; `simulink` and `text` are absent because neither is
 * a thing you execute.
 */
export const NATIVE_LANGS: Partial<Record<Lang, string>> = {
  cpp: 'cpp',
  rust: 'rust',
  bash: 'bash',
  matlab: 'matlab',
}

export interface Capability {
  mode: RunMode
  /** Shown under the run button. Always true of what just happened. */
  note: string
  /** The compiler that will be used, when there is one. */
  toolchain?: string
  /** Set when execution is possible in principle but the tool is missing. */
  missing?: { label: string; install: string }
}

/**
 * What this language can do at this moment, on this machine.
 *
 * Python and SQL are settled: they execute in the renderer and always have.
 * The rest depend on the shell being present and a compiler being installed,
 * so the answer is computed rather than declared, and it changes the moment
 * she installs something and presses refresh.
 */
export function capabilityOf(
  lang: Lang,
  toolchains: Record<string, ToolchainInfo> | null,
  desktop: boolean = isDesktop,
  runner: boolean = hasNativeRunner,
): Capability {
  const info = LANGS[lang]
  if (info.mode === 'execute') return { mode: 'execute', note: info.note }

  const key = NATIVE_LANGS[lang]
  if (!key) return { mode: info.mode, note: info.note }

  if (!desktop) {
    return {
      mode: info.mode,
      note: `${info.label} runs in the ORBIT desktop app, which uses the compiler on your machine. In a browser there is nowhere to compile it, so your output is compared against the expected result.`,
    }
  }

  // In the app, but in a shell older than the curriculum it is showing. Saying
  // "this needs the desktop app" to someone who is looking at the desktop app
  // is the least useful thing we could tell her.
  if (!runner) {
    return {
      mode: info.mode,
      note: `This copy of the ORBIT app is older than the lessons inside it, so it cannot reach a compiler and your output is compared against the expected result instead. Settings has the new app; installing it keeps your progress.`,
      missing: {
        label: 'a newer ORBIT app',
        install: 'Open Settings and install the new ORBIT app. Your progress stays exactly where it is.',
      },
    }
  }

  const tool = toolchains?.[key]
  if (tool?.available) {
    return {
      mode: 'execute',
      note: `Runs for real — compiled and executed by ${tool.version ?? tool.bin} on this machine, in a scratch directory that is thrown away afterwards.`,
      toolchain: tool.version ?? tool.bin,
    }
  }

  // Undetected is not the same as missing: detection may not have run yet.
  if (!toolchains) return { mode: info.mode, note: 'Checking what is installed…' }

  return {
    mode: info.mode,
    note: `${tool?.label ?? info.label} is not installed yet, so your output is compared against the expected result rather than actually run.`,
    missing: {
      label: tool?.label ?? info.label,
      install: tool?.install ?? `Install ${info.label} to run these exercises for real.`,
    },
  }
}

/**
 * Asks the shell what is installed. Returns null in a browser, where the
 * question has no answer, so callers can tell "not applicable" apart from
 * "nothing installed".
 */
export async function detectToolchains(refresh = false): Promise<Record<string, ToolchainInfo> | null> {
  const orbit = getOrbit()
  if (!orbit?.run) return null
  try {
    return await orbit.run.detect(refresh)
  } catch {
    return null
  }
}

/**
 * Compiles and runs through the shell, and reshapes the result into the same
 * `RunOutput` the Python runtime produces so the playground has one shape to
 * render regardless of language.
 */
export async function runNative(lang: Lang, source: string, stdin?: string): Promise<RunOutput> {
  const started = Date.now()
  const empty = (error: string): RunOutput => ({
    stdout: '',
    stderr: '',
    plots: [],
    result: null,
    error,
    ms: Date.now() - started,
  })

  const key = NATIVE_LANGS[lang]
  const orbit = getOrbit()
  if (!key) return empty(`${LANGS[lang].label} cannot be executed.`)
  if (!orbit?.run) {
    return empty(
      isDesktop
        ? 'This copy of the ORBIT app is older than the lessons inside it, so it cannot compile code. Install the new app from Settings — your progress stays where it is.'
        : 'Running this language needs the ORBIT desktop app.',
    )
  }

  let res: RunResult | null
  try {
    const request: RunRequest = { lang: key, source, ...(stdin === undefined ? {} : { stdin }) }
    res = await orbit.run.exec(request)
  } catch (err) {
    return empty(err instanceof Error ? err.message : String(err))
  }
  if (!res) return empty('The shell did not answer the run request.')

  // A compile error belongs in the error slot rather than buried in stderr:
  // it is the thing she needs to read, and the playground highlights it.
  const error =
    res.ok || res.stage === 'run'
      ? res.timedOut
        ? (res.reason ?? 'It was still running and was stopped.')
        : null
      : (res.reason ?? 'It did not run.')

  return {
    stdout: res.stdout,
    stderr: res.stderr,
    plots: [],
    result: null,
    error,
    ms: res.ms,
  }
}

export interface SolutionCheck {
  /** Whether her program produced the same output as the reference. */
  pass: boolean
  detail: string
  yours: RunOutput
  /** Absent when the reference itself failed to build or run. */
  reference?: RunOutput
}

/**
 * Grades a whole-program exercise by running it against the reference.
 *
 * The compiled-language exercises are complete programs that print a result,
 * and they ship a reference solution. So the grade does not need an expected
 * string authored alongside them and kept in sync: compile and run both, and
 * compare what they actually printed. Both really execute, so a pass means
 * her program produced that output on this machine — not that its text
 * resembled something.
 *
 * A reference that will not build is reported as such rather than failing her:
 * that is the curriculum's bug, and telling her she is wrong for it would be
 * the worst possible outcome.
 */
export async function runAgainstSolution(
  lang: Lang,
  code: string,
  solution: string,
  stdin?: string,
): Promise<SolutionCheck> {
  const yours = await runNative(lang, code, stdin)
  if (yours.error) {
    return { pass: false, detail: yours.error, yours }
  }

  const reference = await runNative(lang, solution, stdin)
  if (reference.error) {
    return {
      pass: false,
      detail:
        'Your program ran, but the reference solution for this exercise did not build here, so there is nothing to compare against. That is a fault in the exercise, not in your code.',
      yours,
      reference,
    }
  }

  const check = checkOutput(yours.stdout, reference.stdout)
  return {
    pass: check.pass,
    detail: check.pass ? 'Your output matches the reference solution exactly.' : check.detail,
    yours,
    reference,
  }
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
