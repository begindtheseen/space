/* ============================================================================
   ORBIT — language runtimes
   ----------------------------------------------------------------------------
   What can and cannot actually run in a browser, stated plainly rather than
   papered over:

     Python  real execution, Pyodide in a module worker, full scientific stack
     SQL     real execution, SQLite compiled to WebAssembly
     C++     the desktop shell's clang or gcc when one is installed; everywhere
             else — a browser, or a Mac with no compiler yet — clang++ compiled
             to WebAssembly, downloaded once, so C++ always really runs
     Rust    no rustc-in-WASM exists at all; rustc is used the same way
     Shell   run by the machine's own bash
     MATLAB  proprietary, but Octave runs the same language and is free, so
             Octave is used when installed; the NumPy bridge stays for when
             it is not
     JS      run by the shell's own Node

   Rust, the shell and MATLAB therefore depend on the desktop shell and on
   what is installed. `capabilityOf` answers that per language at the moment
   she presses run, and the UI states the answer rather than guessing.

   The rule underneath all of it: never show a green tick that does not mean
   what it appears to mean. An exercise that was string-compared says so, and
   a missing compiler says which one and how to install it.
   ========================================================================== */
import type { Lang } from '@/curriculum/types'
import { getOrbit, hasNativeRunner, isDesktop, type RunRequest, type RunResult, type ToolchainInfo } from './desktop'

export type RunMode = 'execute' | 'check' | 'reference'

/** What C++ does when there is no compiler on the machine to hand it to. */
const CPP_BROWSER_NOTE =
  'Compiled for real by clang++ (C++20) and run right here, with the input box as standard input. Exceptions are off in this in-browser toolchain, so throw and try do not compile. The compiler is a one-time download of about 105 MB before compression; in the desktop app, installing Apple’s command line tools uses the Mac’s own compiler instead.'

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
    mode: 'execute',
    note: CPP_BROWSER_NOTE,
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
  const key = NATIVE_LANGS[lang]

  // C++ always runs: on the Mac's compiler when there is one, otherwise on
  // the one compiled to WebAssembly. Only the note changes.
  if (lang === 'cpp') {
    const tool = desktop && runner ? toolchains?.cpp : undefined
    if (tool?.available) {
      return {
        mode: 'execute',
        note: `Runs for real — compiled and executed by ${tool.version ?? tool.bin} on this machine, in a scratch directory that is thrown away afterwards.`,
        toolchain: tool.version ?? tool.bin,
      }
    }
    return { mode: 'execute', note: CPP_BROWSER_NOTE }
  }

  if (info.mode === 'execute') return { mode: 'execute', note: info.note }
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
export async function runNative(lang: Lang, source: string, stdin?: string, onStatus?: StatusFn): Promise<RunOutput> {
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
  // No shell to compile with: C++ compiles in the browser instead.
  if (lang === 'cpp' && !orbit?.run) return runCpp(source, { stdin, onStatus })
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
  // The shell is there but the Mac has no C++ compiler yet.
  if (lang === 'cpp' && !res.ok && res.stage === 'toolchain') return runCpp(source, { stdin, onStatus })

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
    /** Stops the run after this long, counted from when the runtime is ready. */
    limitMs?: number
    timer?: ReturnType<typeof setTimeout>
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
      this.startClock()
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

  private startClock(): void {
    const p = this.pending
    if (!p || !p.limitMs || p.timer) return
    const limit = p.limitMs
    p.timer = setTimeout(() => {
      if (this.pending === p) this.cancel(`Still running after ${limit / 1000} seconds, so it was stopped.`)
    }, limit)
  }

  private settle(): void {
    const p = this.pending
    if (!p) return
    clearTimeout(p.timer)
    this.pending = null
    p.out.ms = Date.now() - p.startedAt
    p.resolve(p.out)
  }

  private fail(message: string): void {
    const p = this.pending
    if (p) clearTimeout(p.timer)
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
    opts: { stdin?: string[]; packages?: string[]; onStatus?: StatusFn; limitMs?: number } = {},
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
        ...(opts.limitMs ? { limitMs: opts.limitMs } : {}),
      }
      w.postMessage({ cmd: 'run', id, code, stdin: opts.stdin, packages: opts.packages })
      if (this.booted) this.startClock()
    })
  }

  /** Kills the worker. The next run pays the boot cost again. */
  cancel(reason = 'Stopped.'): void {
    const p = this.pending
    if (p) clearTimeout(p.timer)
    this.pending = null
    this.worker?.terminate()
    this.worker = null
    this.booted = false
    if (p) {
      p.out.error = reason
      p.out.ms = Date.now() - p.startedAt
      p.resolve(p.out)
    }
  }
}

export const python = new PythonRuntime()

/* ── A compiler that lives in a worker ───────────────────────────────────────
   The in-browser C++ compiler is large, so it lives in one worker that is
   created on first use and kept: loading it is the expensive part,
   and a compile always finishes. What they produce is run elsewhere, in a
   worker thrown away after each run, so a program that never ends can be
   stopped without throwing the compiler away with it. */

interface CompileReply {
  type: 'compiled' | 'failed'
  stage?: 'load' | 'compile' | 'check'
  diagnostics: string
  wasm?: ArrayBuffer
  js?: string
}

class CompilerWorker {
  private worker: Worker | null = null
  private nextId = 1
  private waiting = new Map<number, { resolve: (r: CompileReply) => void; onStatus?: StatusFn }>()

  private readonly create: () => Worker
  private readonly verb: string
  private readonly crashed: string

  constructor(create: () => Worker, verb: string, crashed: string) {
    this.create = create
    this.verb = verb
    this.crashed = crashed
  }

  private ensure(): Worker {
    if (this.worker) return this.worker
    const w = this.create()
    w.onmessage = (e: MessageEvent) => {
      const msg = e.data as Omit<CompileReply, 'type'> & { type: CompileReply['type'] | 'status'; id: number; text?: string }
      const entry = this.waiting.get(msg.id)
      if (!entry) return
      if (msg.type === 'status') {
        entry.onStatus?.(msg.text ?? '')
        return
      }
      this.waiting.delete(msg.id)
      entry.resolve({ ...msg, type: msg.type })
    }
    w.onerror = (e) => {
      e.preventDefault()
      this.reset(this.crashed)
    }
    this.worker = w
    return w
  }

  /** Throws the worker away and fails whatever was waiting on it. */
  private reset(message: string): void {
    this.worker?.terminate()
    this.worker = null
    for (const [, entry] of this.waiting) entry.resolve({ type: 'failed', stage: 'load', diagnostics: message })
    this.waiting.clear()
  }

  /** Starts downloading the compiler without compiling anything. */
  preload(): void {
    this.ensure().postMessage({ cmd: 'preload' })
  }

  compile(source: string, onStatus?: StatusFn): Promise<CompileReply> {
    const w = this.ensure()
    const id = this.nextId++
    return new Promise<CompileReply>((resolve) => {
      this.waiting.set(id, { resolve, onStatus })
      w.postMessage({ cmd: this.verb, id, source })
    })
  }
}

export const cppCompiler = new CompilerWorker(
  () => new Worker(new URL('../workers/cpp.worker.ts', import.meta.url), { type: 'module' }),
  'compile',
  'The C++ compiler stopped unexpectedly (most often the tab ran short of memory). Press Run again to reload it.',
)

/* ── C++ ─────────────────────────────────────────────────────────────────── */

export const CPP_TIME_LIMIT_MS = 10_000

/**
 * Compiles with clang++ in the browser, then runs the program in a fresh
 * worker with `stdin` as its standard input. A compile error comes back in
 * `error`, exactly as clang printed it; warnings on a program that did build
 * are shown with its output.
 */
export async function runCpp(
  code: string,
  opts: { stdin?: string; onStatus?: StatusFn; timeLimitMs?: number } = {},
): Promise<RunOutput> {
  const started = Date.now()
  const out: RunOutput = { stdout: '', stderr: '', plots: [], result: null, error: null, ms: 0 }

  const built = await cppCompiler.compile(code, opts.onStatus)
  if (built.type === 'failed' || !built.wasm) {
    out.error =
      built.stage === 'compile'
        ? `It did not compile:\n\n${built.diagnostics.trim()}`
        : built.diagnostics.trim() || 'The C++ compiler could not be loaded.'
    out.ms = Date.now() - started
    return out
  }
  if (built.diagnostics.trim()) out.stderr += `${built.diagnostics.trim()}\n\n`
  opts.onStatus?.('Running…')

  const limit = opts.timeLimitMs ?? CPP_TIME_LIMIT_MS
  return new Promise<RunOutput>((resolve) => {
    let worker: Worker
    try {
      worker = new Worker(new URL('../workers/wasi.worker.ts', import.meta.url), { type: 'module' })
    } catch (err) {
      out.error = err instanceof Error ? err.message : String(err)
      out.ms = Date.now() - started
      resolve(out)
      return
    }
    const finish = (error?: string) => {
      clearTimeout(timer)
      worker.terminate()
      if (error) out.error = error
      out.ms = Date.now() - started
      resolve(out)
    }
    const timer = setTimeout(
      () =>
        finish(
          `Still running after ${Math.round(limit / 1000)} seconds, so it was stopped. A loop that never ends, or a read from standard input that is waiting for more, does this.`,
        ),
      limit,
    )
    worker.onmessage = (e: MessageEvent) => {
      const msg = e.data as { type: string; text?: string; code?: number; message?: string }
      if (msg.type === 'stdout') out.stdout += msg.text ?? ''
      else if (msg.type === 'stderr') out.stderr += msg.text ?? ''
      else if (msg.type === 'exit') {
        if (msg.code) out.result = `exit code ${msg.code}`
        finish()
      } else if (msg.type === 'trap') {
        finish(
          `The program crashed: ${msg.message}. abort(), a failed assert, an out-of-range .at(), dividing an integer by zero and reading memory the program does not own all end this way.`,
        )
      }
    }
    worker.onerror = (e) => {
      e.preventDefault()
      finish(e.message || 'The program runner failed to start.')
    }
    const wasm = built.wasm!
    worker.postMessage({ cmd: 'run', id: 1, wasm, stdin: opts.stdin ?? '' }, [wasm])
  })
}


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
