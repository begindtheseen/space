/* ============================================================================
   Learn mode — ORBIT's side
   ----------------------------------------------------------------------------
   The only file in src/learn that differs between the apps carrying Learn
   mode: which languages this app teaches, and how it runs them. Everything
   else — the format, the lessons, the grading — is shared.

   ORBIT teaches what its playground can always run: Python (Pyodide), SQL
   (sql.js), C++ (the Mac's compiler in the desktop app when one is installed,
   clang++ compiled to WebAssembly everywhere else), and the terminal, on the
   in-page practice shell, so the basics of the command line and git are the
   same on every machine. Rust, shell scripts and MATLAB only run through a
   toolchain on the Mac, so their basics come later.
   ========================================================================== */
import type { Lang } from '@/curriculum/types'
import { python as py, runNative, runSql, type RunOutput, type StatusFn } from '@/lib/runtimes'
import type { ShellState } from '@/lib/shell'
import type { LearnLang, LearnLesson, LearnRun, Roadmap } from './types'

/** The languages this app teaches, in the order a beginner should meet them. */
const TAUGHT: LearnLang[] = ['bash', 'git', 'python', 'sql', 'cpp']

/*
 * Every course file in tracks/: `<lang>.txt` is a language's basics, and
 * `<lang>.<level>.txt` the courses after it. The files are the same ones
 * LAUNCHPAD carries; ORBIT takes the languages it teaches.
 */
const FILES = import.meta.glob('./tracks/*.txt', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const LEVEL_ORDER = ['basics', 'intermediate', 'advanced', 'expert', 'projects']

function sortKey(file: string): [number, number] {
  const [lang = '', level = 'basics'] = file.replace(/\.txt$/, '').split('.')
  return [TAUGHT.indexOf(lang as LearnLang), LEVEL_ORDER.indexOf(level)]
}

/** [file name, text] for every course this app teaches, language by language, basics first. */
export const LEARN_SOURCES: [string, string][] = Object.entries(FILES)
  .map(([path, text]): [string, string] => [path.split('/').pop()!, text])
  .filter(([file]) => sortKey(file)[0] >= 0)
  .sort((a, b) => {
    const [la, va] = sortKey(a[0])
    const [lb, vb] = sortKey(b[0])
    return la - lb || va - vb
  })

export const LEARN_LANGS: LearnLang[] = TAUGHT.filter((l) => LEARN_SOURCES.some(([f]) => f.split('.')[0] === l))

/**
 * The goals Learn to code opens on, each an order ORBIT's own modules use:
 * the terminal and git underneath everything (Linux and the Shell, Git), then
 * Python for analysis and simulation and C++ for the code that flies.
 */
export const ROADMAPS: Roadmap[] = [
  {
    id: 'gnc',
    title: 'GNC Engineer',
    blurb: 'Guidance, navigation and control: the command line and git underneath the work, Python for the analysis and the simulations, and C++ for the flight code.',
    steps: ['bash', 'git', 'python', 'cpp'],
  },
  {
    id: 'flight-software',
    title: 'Flight Software',
    blurb: 'Code that flies: the command line and git every flight team works in, C++ exact about types and memory, and Python for the tools and tests around it.',
    steps: ['bash', 'git', 'cpp', 'python'],
  },
  {
    id: 'test-data',
    title: 'Test & Data',
    blurb: 'Every test campaign ends in data: Python to analyse it, SQL to pull telemetry out of where it is kept, and the command line and git to keep the analysis reproducible.',
    steps: ['python', 'sql', 'bash', 'git'],
  },
  {
    id: 'software',
    title: 'Software Engineer',
    blurb: 'The ground every software job stands on: one language learned properly, the command line and git, SQL, and then C++ to see what the machine is really doing.',
    steps: ['python', 'bash', 'git', 'sql', 'cpp'],
  },
]

function fromOutput(out: RunOutput): LearnRun {
  return { stdout: out.stdout, stderr: out.stderr, error: out.error, ms: out.ms }
}

/**
 * Runs a lesson's checked program (see grade.ts) with this app's runtimes.
 * A Terminal lesson has nothing to run: its checks read the shell she typed
 * into, passed in as `shell`.
 */
export async function runLearn(
  lesson: LearnLesson,
  program: string,
  opts: { onStatus?: StatusFn; shell?: ShellState } = {},
): Promise<LearnRun> {
  const { onStatus } = opts
  switch (lesson.lang) {
    case 'bash':
    case 'git':
      return { stdout: '', stderr: '', error: null, ...(opts.shell ? { shell: opts.shell } : {}), ms: 0 }
    case 'python': {
      const stdin = lesson.stdin?.replace(/\n$/, '').split('\n')
      return fromOutput(await py.run(program, { onStatus, ...(stdin ? { stdin } : {}) }))
    }
    case 'cpp':
      return fromOutput(await runNative('cpp', program, lesson.stdin ?? '', onStatus))
    case 'sql': {
      const r = await runSql(program, lesson.schema)
      // sql.js hands back numbers, strings and nulls (and blobs, which no lesson uses).
      return { stdout: '', stderr: '', error: r.error, tables: r.tables as LearnRun['tables'], ms: r.ms }
    }
    default:
      return { stdout: '', stderr: '', error: `ORBIT does not run ${lesson.lang}.`, ms: 0 }
  }
}

/** The editor's grammar for a lesson's language. */
export function editorLang(lang: LearnLang): Lang {
  if (lang === 'git') return 'bash'
  return lang === 'python' || lang === 'sql' || lang === 'cpp' || lang === 'bash' ? lang : 'text'
}

/** Starts a language's runtime downloading before the first Run, where that is cheap. */
export function warmUp(lang: LearnLang): void {
  if (lang === 'python' && !py.isBooted) py.preload()
}
