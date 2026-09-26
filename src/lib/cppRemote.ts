/* ============================================================================
   C++ where the browser cannot compile it: a compiler service
   ----------------------------------------------------------------------------
   Everywhere else, C++ compiles in the tab (workers/cpp.worker.ts). On an
   iPhone or iPad it cannot: the compiler is one 75 MB WebAssembly module, and
   iOS gives a web page far too little room to turn that into machine code —
   whichever browser it is, since on iOS every browser is Safari underneath.
   So there, and anywhere the in-tab compiler fails to start, the code goes to
   a public compiler service that compiles and runs it and sends back what it
   printed: Compiler Explorer (godbolt.org) first, Wandbox if that is down.

   It is the one place in the app where code leaves the device, so the output
   always says so. Same flags as in the tab — C++20, warnings on, exceptions
   off — so a program behaves the same wherever it was built.
   ========================================================================== */
import type { RunOutput, StatusFn } from '@/lib/runtimes'

export const CXX_FLAGS = ['-std=c++20', '-O1', '-Wall', '-Wextra', '-fno-exceptions', '-fno-color-diagnostics']

const CE = 'https://godbolt.org/api'
const WANDBOX = 'https://wandbox.org/api'

/**
 * Whether this device cannot compile C++ in the tab. Every browser on iOS and
 * iPadOS is WebKit with the same limit; an iPad asking for the desktop site
 * says it is a Mac, and only its touch screen gives it away.
 */
export function inTabCppUnavailable(nav: { userAgent?: string; maxTouchPoints?: number; platform?: string } = navigator): boolean {
  const ua = nav.userAgent ?? ''
  if (/iPhone|iPad|iPod/.test(ua)) return true
  return /Macintosh/.test(ua) && (nav.maxTouchPoints ?? 0) > 1
}

type Line = { text: string }
const joinLines = (lines: Line[] | undefined) => (lines ?? []).map((l) => l.text).join('\n')

interface CeResult {
  code?: number
  didExecute?: boolean
  timedOut?: boolean
  stdout?: Line[]
  stderr?: Line[]
  buildResult?: { code?: number; stdout?: Line[]; stderr?: Line[] }
  execResult?: CeResult
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as T
}

/** Newest first by a dotted version. */
function byVersion(a: string, b: string): number {
  const pa = a.split(/[.\-]/).map((n) => parseInt(n, 10) || 0)
  const pb = b.split(/[.\-]/).map((n) => parseInt(n, 10) || 0)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pb[i] ?? 0) - (pa[i] ?? 0)
  return 0
}

let ceCompiler: Promise<string> | null = null

/** The newest released clang Compiler Explorer can run programs with. Asked once per session. */
export function pickCeCompiler(list: { id: string; semver?: string; supportsExecute?: boolean }[]): string | null {
  const clangs = list.filter((c) => /^clang\d+$/.test(c.id) && c.supportsExecute !== false && /^\d+(\.\d+)*$/.test(c.semver ?? ''))
  clangs.sort((a, b) => byVersion(a.semver!, b.semver!))
  return clangs[0]?.id ?? null
}

async function viaCompilerExplorer(code: string, stdin: string): Promise<RunOutput> {
  ceCompiler ??= fetch(`${CE}/compilers/c++?fields=id,semver,supportsExecute`, { headers: { Accept: 'application/json' } })
    .then((r) => json<{ id: string; semver?: string; supportsExecute?: boolean }[]>(r))
    .then((list) => pickCeCompiler(list) ?? 'clang1810')
  ceCompiler.catch(() => (ceCompiler = null))
  const id = await ceCompiler
  const res = await fetch(`${CE}/compiler/${encodeURIComponent(id)}/compile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      source: code,
      lang: 'c++',
      allowStoreCodeDebug: false,
      options: {
        userArguments: CXX_FLAGS.join(' '),
        executeParameters: { args: [], stdin },
        compilerOptions: { executorRequest: true, skipAsm: true },
        filters: { execute: true },
        tools: [],
        libraries: [],
      },
    }),
  })
  return fromCompilerExplorer(await json<CeResult>(res))
}

/** Compiler Explorer's answer, in the shape every run returns. */
export function fromCompilerExplorer(body: CeResult): RunOutput {
  const exec = body.execResult ?? body
  const build = exec.buildResult ?? body
  const out: RunOutput = { stdout: '', stderr: '', plots: [], result: null, error: null, ms: 0 }
  const buildOutput = [joinLines(build.stdout), joinLines(build.stderr)].filter(Boolean).join('\n').trim()
  if (!exec.didExecute) {
    out.error = (build.code ?? 1) !== 0 ? `It did not compile:\n\n${buildOutput}` : buildOutput || 'The compiler service could not run the program.'
    return out
  }
  if (buildOutput) out.stderr += `${buildOutput}\n\n`
  out.stdout = joinLines(exec.stdout) + (exec.stdout?.length ? '\n' : '')
  out.stderr += joinLines(exec.stderr) + (exec.stderr?.length ? '\n' : '')
  if (exec.timedOut) out.error = 'Still running when the compiler service stopped it. A loop that never ends, or a read from standard input that is waiting for more, does this.'
  else if (exec.code) out.result = `exit code ${exec.code}`
  return out
}

interface WandboxResult {
  status?: string
  signal?: string
  compiler_error?: string
  compiler_message?: string
  program_output?: string
  program_error?: string
}

let wandboxCompiler: Promise<string> | null = null

export function pickWandboxCompiler(list: { name: string; language?: string; version?: string }[]): string | null {
  const clangs = list.filter((c) => c.language === 'C++' && /^clang-\d/.test(c.name) && /^\d+(\.\d+)*$/.test(c.version ?? ''))
  clangs.sort((a, b) => byVersion(a.version!, b.version!))
  return clangs[0]?.name ?? null
}

async function viaWandbox(code: string, stdin: string): Promise<RunOutput> {
  wandboxCompiler ??= fetch(`${WANDBOX}/list.json`)
    .then((r) => json<{ name: string; language?: string; version?: string }[]>(r))
    .then((list) => pickWandboxCompiler(list) ?? 'clang-head')
  wandboxCompiler.catch(() => (wandboxCompiler = null))
  const compiler = await wandboxCompiler
  const res = await fetch(`${WANDBOX}/compile.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ compiler, code, stdin, 'compiler-option-raw': CXX_FLAGS.join('\n'), save: false }),
  })
  return fromWandbox(await json<WandboxResult>(res))
}

export function fromWandbox(body: WandboxResult): RunOutput {
  const out: RunOutput = { stdout: '', stderr: '', plots: [], result: null, error: null, ms: 0 }
  const ran = body.status !== undefined || body.program_output !== undefined || body.signal !== undefined
  if (!ran) {
    out.error = `It did not compile:\n\n${(body.compiler_error ?? body.compiler_message ?? '').trim()}`
    return out
  }
  if (body.compiler_error?.trim()) out.stderr += `${body.compiler_error.trim()}\n\n`
  out.stdout = body.program_output ?? ''
  out.stderr += body.program_error ?? ''
  if (body.signal) out.error = `The program crashed (${body.signal}).`
  else if (body.status && body.status !== '0') out.result = `exit code ${body.status}`
  return out
}

/** Why the code went to a server, said once with the output. */
export const REMOTE_NOTE_IOS =
  'Compiled and run by Compiler Explorer (godbolt.org): an iPhone or iPad cannot run the C++ compiler inside the browser, so this code was sent there.'
export const REMOTE_NOTE_FALLBACK =
  'Compiled and run by Compiler Explorer (godbolt.org), because the C++ compiler could not start in this browser; this code was sent there.'

/** Compiles and runs on a compiler service. Never throws: a failure comes back in `error`. */
export async function runCppRemote(code: string, opts: { stdin?: string; onStatus?: StatusFn; note: string }): Promise<RunOutput> {
  const started = Date.now()
  const stdin = opts.stdin ?? ''
  opts.onStatus?.('Compiling on Compiler Explorer…')
  let out: RunOutput
  let note = opts.note
  try {
    out = await viaCompilerExplorer(code, stdin)
  } catch (first) {
    try {
      opts.onStatus?.('Compiling on Wandbox…')
      out = await viaWandbox(code, stdin)
      note = note.replace('Compiler Explorer (godbolt.org)', 'Wandbox (wandbox.org)')
    } catch (second) {
      return {
        stdout: '',
        stderr: '',
        plots: [],
        result: null,
        error:
          'C++ could not be compiled: this device cannot run the compiler in the browser, and the compiler services ' +
          `(godbolt.org, wandbox.org) could not be reached. Check the connection and press Run again. ` +
          `(${first instanceof Error ? first.message : String(first)}; ${second instanceof Error ? second.message : String(second)})`,
        ms: Date.now() - started,
      }
    }
  }
  out.stderr = `${note}\n\n${out.stderr}`
  out.ms = Date.now() - started
  return out
}
