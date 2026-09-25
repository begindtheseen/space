/* ============================================================================
   Learn mode — ORBIT's side
   ----------------------------------------------------------------------------
   The only file in src/learn that differs between the apps carrying Learn
   mode: which languages this app teaches, and how it runs them. Everything
   else — the format, the lessons, the grading — is shared.

   ORBIT teaches the three languages its playground can always run: Python
   (Pyodide), SQL (sql.js) and C++ (the Mac's compiler in the desktop app when
   one is installed, clang++ compiled to WebAssembly everywhere else). Rust,
   the shell and MATLAB only run through a toolchain on the Mac, so their
   basics come later.
   ========================================================================== */
import type { Lang } from '@/curriculum/types'
import { python as py, runNative, runSql, type RunOutput, type StatusFn } from '@/lib/runtimes'
import cpp from './tracks/cpp.txt?raw'
import python from './tracks/python.txt?raw'
import sql from './tracks/sql.txt?raw'
import type { LearnLang, LearnLesson, LearnRun } from './types'

/** The tracks this app teaches, in the order a beginner should meet them. */
export const LEARN_SOURCES: [LearnLang, string][] = [
  ['python', python],
  ['sql', sql],
  ['cpp', cpp],
]

export const LEARN_LANGS: LearnLang[] = LEARN_SOURCES.map(([lang]) => lang)

function fromOutput(out: RunOutput): LearnRun {
  return { stdout: out.stdout, stderr: out.stderr, error: out.error, ms: out.ms }
}

/** Runs a lesson's checked program (see grade.ts) with this app's runtimes. */
export async function runLearn(lesson: LearnLesson, program: string, onStatus?: StatusFn): Promise<LearnRun> {
  switch (lesson.lang) {
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
  return lang === 'python' || lang === 'sql' || lang === 'cpp' ? lang : 'text'
}

/** Starts a language's runtime downloading before the first Run, where that is cheap. */
export function warmUp(lang: LearnLang): void {
  if (lang === 'python' && !py.isBooted) py.preload()
}
