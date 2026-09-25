/* ============================================================================
   Which languages each module practises in
   ----------------------------------------------------------------------------
   The one per-app file behind "Try it here" and runnable lesson code. For
   ORBIT a module practises in the languages its own code exercises use; one
   with none falls back on what its lessons are about — C++ for the C++
   modules, the practice terminal for Linux and git, Python for the GNC
   modules, where the analysis and simulation happen. The career modules are
   not code, and get none.
   ========================================================================== */
import type { Lang, Module } from '@/curriculum/types'
import { langOfFence } from '@/lib/run'
import { shellCanRun } from '@/lib/shell'

const RUNS: Lang[] = ['python', 'cpp', 'sql', 'bash', 'rust', 'matlab']

export function practiceLangs(module: Module): Lang[] {
  const fromExercises = [
    ...new Set((module.exercises ?? []).filter((e) => e.kind === 'code' && e.lang && RUNS.includes(e.lang)).map((e) => e.lang!)),
  ]
  // Shell scripts need the desktop app; the practice terminal works everywhere.
  const ordered = fromExercises.sort((a, b) => RUNS.indexOf(a) - RUNS.indexOf(b))
  if (ordered.length) return ordered
  const id = module.id
  if (id.startsWith('car_')) return []
  if (id.includes('cpp')) return ['cpp']
  if (id.includes('lnx') || id.includes('git')) return ['bash']
  return ['python']
}

/**
 * Whether a fenced code block in a lesson can run in place as written: shell
 * blocks only when every command is one the practice terminal knows, C++
 * only when it is a whole program.
 */
export function runnableFence(info: string, code: string): Lang | null {
  const lang = langOfFence(info)
  if (!lang) return null
  if (lang === 'bash') return shellCanRun(code) ? 'bash' : null
  if (lang === 'cpp') return /\bint\s+main\s*\(/.test(code) ? 'cpp' : null
  if (lang === 'rust') return /\bfn\s+main\s*\(/.test(code) ? 'rust' : null
  return lang
}
