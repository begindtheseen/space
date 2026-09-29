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
/** The words after the language on a fence line (`fragment`, `error`). */
export function fenceFlags(info: string): string[] {
  return info.trim().split(/\s+/).slice(1)
}

export function runnableFence(info: string, code: string): Lang | null {
  const lang = langOfFence(info)
  if (!lang) return null
  if (lang === 'bash') return shellCanRun(code) ? 'bash' : null
  // ```cpp fragment: a piece of a program, shown but never run. ```cpp error:
  // a program the lesson runs to show its compiler error, so Run stays.
  // ```cpp laptop: a whole program that needs exceptions, which the in-browser compiler turns off.
  if (fenceFlags(info).includes('fragment') || fenceFlags(info).includes('laptop')) return null
  // A piece of a program shown on its own (`int main() {`, `def f():`) is
  // explained, not run: pressing Run on it could only fail to compile.
  if (!isWhole(lang, code)) return null
  if (lang === 'cpp') return /\bint\s+main\s*\(/.test(code) ? 'cpp' : null
  if (lang === 'rust') return /\bfn\s+main\s*\(/.test(code) ? 'rust' : null
  return lang
}

/** Every bracket closed, and (Python) no block left open at the end. */
export function isWhole(lang: Lang, code: string): boolean {
  const hash = lang === 'python' || lang === 'bash'
  const stripped = code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
    // Single quotes: Python strings; C++ and Rust one-character literals (not
    // lifetimes or digit separators); MATLAB transposes, so left alone there.
    .replace(lang === 'python' || lang === 'sql' ? /'(?:[^'\\\n]|\\.)*'/g : lang === 'matlab' ? /(?<![\w)\]}.'])'[^'\n]*'/g : /'(?:\\.|[^'\\\n])'/g, "''")
    .replace(hash ? /#.*$/gm : lang === 'sql' || lang === 'matlab' ? /(--|%).*$/gm : /\/\/.*$/gm, '')
  const open: string[] = []
  const pair: Record<string, string> = { ')': '(', ']': '[', '}': '{' }
  for (const ch of stripped) {
    if (ch === '(' || ch === '[' || ch === '{') open.push(ch)
    else if (ch in pair) {
      if (open.pop() !== pair[ch]) return false
    }
  }
  if (open.length) return false
  if (lang === 'python') {
    const last = stripped.split('\n').map((l) => l.trimEnd()).filter((l) => l.trim()).pop() ?? ''
    if (last.endsWith(':')) return false
  }
  return true
}
