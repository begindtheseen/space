/* ============================================================================
   Running a piece of code, wherever it appears
   ----------------------------------------------------------------------------
   One entry point for everything that runs code outside the full playground
   page: the playground embedded in a module lesson, a runnable example in a
   lesson's text, an exercise done on the module page, a Workbench scenario.
   It hands the code to the same runtimes the playground uses
   (lib/runtimes.ts) and returns one shape for every language.

   This is the one file here that differs between the apps carrying the
   embed. ORBIT runs Python and SQL in the browser, C++ on the Mac's compiler
   when there is one and in the browser otherwise, and Rust, MATLAB (through
   Octave) and shell scripts on the Mac's own tools in the desktop app —
   anywhere else those say plainly that they did not run, and why.
   ========================================================================== */
import type { Lang } from '@/curriculum/types'
import { capabilityOf, detectToolchains, python, runNative, runSql, type StatusFn } from '@/lib/runtimes'

export interface CodeRun {
  stdout: string
  stderr: string
  error: string | null
  /** Python figures, as data URLs. */
  plots: string[]
  /** The value of the last expression, where the language reports one. */
  result: string | null
  /** SQL result sets, in order. */
  tables?: { columns: string[]; rows: unknown[][] }[]
  /** Set when nothing ran, and why: shown instead of an empty console. */
  notRun?: string
  ms: number
}

/** Languages an embed offers to run in place. */
export const EMBED_LANGS: Lang[] = ['python', 'cpp', 'sql', 'bash', 'rust', 'matlab']

/** Maps a fenced code block's info string to one of ORBIT's languages. */
export function langOfFence(info: string): Lang | null {
  const word = info.trim().split(/\s+/)[0]?.toLowerCase() ?? ''
  const map: Record<string, Lang> = {
    python: 'python',
    py: 'python',
    cpp: 'cpp',
    'c++': 'cpp',
    cc: 'cpp',
    sql: 'sql',
    bash: 'bash',
    sh: 'bash',
    shell: 'bash',
    console: 'bash',
    rust: 'rust',
    rs: 'rust',
    matlab: 'matlab',
    octave: 'matlab',
  }
  return map[word] ?? null
}

export function canRun(lang: Lang): boolean {
  return EMBED_LANGS.includes(lang)
}

export function warm(lang: Lang): void {
  if (lang === 'python' && !python.isBooted) python.preload()
}

export function cancel(lang: Lang): void {
  if (lang === 'python') python.cancel()
}

const empty = (ms = 0): CodeRun => ({ stdout: '', stderr: '', error: null, plots: [], result: null, ms })

/** Runs code the way the playground would, and returns what happened. */
export async function runCode(lang: Lang, code: string, opts: { stdin?: string; schema?: string; onStatus?: StatusFn } = {}): Promise<CodeRun> {
  switch (lang) {
    case 'python': {
      const lines = opts.stdin ? opts.stdin.replace(/\n$/, '').split('\n') : undefined
      return await python.run(code, { onStatus: opts.onStatus, ...(lines ? { stdin: lines } : {}) })
    }
    case 'sql': {
      const r = await runSql(code, opts.schema)
      return { ...empty(r.ms), error: r.error, tables: r.tables }
    }
    case 'cpp':
      return await runNative('cpp', code, opts.stdin ?? '', opts.onStatus)
    case 'rust':
    case 'matlab':
    case 'bash': {
      const cap = capabilityOf(lang, await detectToolchains())
      if (cap.mode !== 'execute') return { ...empty(), notRun: `Not run here. ${cap.note}${cap.missing ? ` ${cap.missing.label} is not installed: ${cap.missing.install}` : ''}` }
      return await runNative(lang, code, opts.stdin, opts.onStatus)
    }
    default:
      return { ...empty(), notRun: 'This kind of block is for reading, not running.' }
  }
}
