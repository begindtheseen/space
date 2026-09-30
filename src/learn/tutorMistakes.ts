/* ============================================================================
   ORBIT — realistic mistakes, made on purpose (for testing the tutor)
   ----------------------------------------------------------------------------
   Each mutator takes a correct Terminal or Git solution and makes one mistake
   a learner really makes: a file name misspelt or capitalised, a command
   misspelt, a step done while standing in the wrong folder, two steps swapped,
   > where >> was needed, text sent into the wrong file, a file added but never
   committed, a branch misspelt. The tutor evaluation runs every mutated
   solution on the real practice shell and checks that the tutor names the
   mistake that was actually made. Test-only.
   ========================================================================== */
import { lessonShell } from './grade'
import type { LearnLesson } from './types'
import { run as runShell, type ShellState } from '@/lib/shell'
import type { DiagnosisKind } from './tutorText'

export interface Mistake {
  name: string
  lines: string[]
  /** What the tutor should call it. */
  expect: DiagnosisKind[]
  /** A word the tutor's line should contain, when there is one that proves it saw the real mistake. */
  mention?: string
}

const CREATES = /^(touch|mkdir)\s/
const tokens = (line: string) => line.match(/"[^"]*"|'[^']*'|\S+/g) ?? []

/** Swaps two letters in the middle of a name, or drops one when it is too short to swap. */
function misspell(name: string): string {
  const [stem, ext = ''] = /^(.+?)(\.\w+)?$/.exec(name)!.slice(1) as [string, string | undefined]
  if (stem.length >= 4) {
    const i = Math.floor(stem.length / 2) - 1
    return stem.slice(0, i) + stem[i + 1] + stem[i] + stem.slice(i + 2) + (ext ?? '')
  }
  return stem.length >= 2 ? stem.slice(0, -1) + (ext ?? '') : `${stem}x${ext ?? ''}`
}

/** Which names a line makes: the arguments of touch and mkdir, and the file after a redirect. */
function madeNames(line: string): string[] {
  const t = tokens(line)
  if (CREATES.test(line)) return t.slice(1).filter((x) => !x.startsWith('-'))
  const r = /(?:^|\s)>>?\s*(\S+)/.exec(line)
  return r ? [r[1]!] : []
}

function replaceName(line: string, from: string, to: string): string {
  return line.replace(new RegExp(`(^|[\\s/>])${from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|[\\s/])`), `$1${to}`)
}

/** Folders that exist in the lesson's start state under ~/project, other than the one she starts in. */
function otherFolders(s: ShellState): string[] {
  const out: string[] = []
  const walk = (node: ShellState['root'] | undefined, path: string) => {
    if (!node || node.kind !== 'dir') return
    for (const [n, c] of Object.entries(node.children)) {
      if (c.kind === 'dir' && n !== '.git') {
        const p = path ? `${path}/${n}` : n
        out.push(p)
      }
    }
  }
  let node: ShellState['root'] | undefined = s.root
  for (const part of s.cwd.split('/').filter(Boolean)) node = node?.kind === 'dir' ? (node.children[part] as ShellState['root']) : undefined
  walk(node, '')
  return out
}

export function mistakesFor(lesson: LearnLesson): Mistake[] {
  const lines = lesson.solution.split('\n').filter((l) => l.trim())
  const out: Mistake[] = []
  const at = (i: number, line: string) => lines.map((l, k) => (k === i ? line : l))
  const start = lessonShell(lesson)

  lines.forEach((line, i) => {
    const names = madeNames(line).filter((n) => /^[\w.-]+$/.test(n) && n.length >= 3)
    const made = names[0]
    if (made) {
      const typo = misspell(made)
      // The same slip everywhere later in the solution would make it consistent and "right"; only this line slips.
      out.push({ name: 'typo-name', lines: at(i, replaceName(line, made, typo)), expect: ['spelling', 'place'], mention: made })
      const capital = made[0]!.toUpperCase() + made.slice(1)
      if (capital !== made) out.push({ name: 'case-name', lines: at(i, replaceName(line, made, capital)), expect: ['spelling'], mention: made })
      // Done while standing in the wrong folder.
      const folders = otherFolders(start)
      if (folders.length && !/^\s*cd\b/.test(line) && !lines.slice(0, i).some((l) => /^\s*cd\b/.test(l)))
        out.push({ name: 'wrong-folder', lines: [...lines.slice(0, i), `cd ${folders[0]}`, ...lines.slice(i)], expect: ['place', 'folder', 'spelling'] })
    }
    const cmd = tokens(line)[0] ?? ''
    if (/^[a-z]{3,}$/.test(cmd) && cmd !== 'echo') {
      out.push({ name: 'typo-command', lines: at(i, line.replace(cmd, misspell(cmd))), expect: ['spelling'], mention: cmd })
      out.push({ name: 'case-command', lines: at(i, line.replace(cmd, cmd.toUpperCase())), expect: ['spelling'], mention: cmd })
    }
    if (/>>/.test(line) && lines.slice(0, i).some((l) => l.includes(`> ${madeNames(line)[0]}`) || l.includes(`>> ${madeNames(line)[0]}`)))
      out.push({ name: 'overwrite', lines: at(i, line.replace('>>', '>')), expect: ['content'] })
    const target = madeNames(line)[0]
    if (/>/.test(line) && target) {
      const other = lines.flatMap(madeNames).find((n) => n !== target && /^[\w.-]+$/.test(n))
      if (other) out.push({ name: 'wrong-file', lines: at(i, replaceName(line, target, other)), expect: ['wrong-file', 'content', 'missing', 'error', 'spelling'] })
    }
    if (/^mv\s/.test(line)) out.push({ name: 'cp-not-mv', lines: at(i, line.replace(/^mv/, 'cp')), expect: ['check', 'wrong-file'] })
    const cdArg = /^cd\s+([\w.-][\w./-]*)$/.exec(line)?.[1]
    if (cdArg && !cdArg.startsWith('.')) out.push({ name: 'leading-slash', lines: at(i, `cd /${cdArg}`), expect: ['error'] })
    const branch = /^git (?:switch -c|checkout -b|branch) ([\w/-]{3,})$/.exec(line)?.[1]
    if (branch) out.push({ name: 'typo-branch', lines: lines.map((l) => (l === line ? l.replace(branch, misspell(branch)) : l)), expect: ['spelling', 'git'], mention: branch })
    if (/^git add\b/.test(line)) out.push({ name: 'no-add', lines: lines.filter((_, k) => k !== i), expect: ['git', 'order'] })
  })
  // Two steps in the wrong order: each pair where the later one needs the earlier.
  for (let i = 0; i + 1 < lines.length; i++) {
    const a = lines[i]!
    const b = lines[i + 1]!
    const needs = (CREATES.test(a) && madeNames(a).some((n) => b.includes(`${n}/`) || new RegExp(`^cd\\s+${n}\\b`).test(b))) || (/^git add\b/.test(a) && /^git commit\b/.test(b)) || (/^git init\b/.test(a) && /^git\b/.test(b))
    if (needs) out.push({ name: 'swap', lines: [...lines.slice(0, i), b, a, ...lines.slice(i + 2)], expect: ['order'] })
  }
  // A step left out.
  if (lines.length > 1) out.push({ name: 'drop-last', lines: lines.slice(0, -1), expect: ['missing', 'git', 'check', 'content', 'order', 'folder', 'place', 'spelling', 'wrong-file'] })
  return out
}

/** The shell after typing these lines from the lesson's start. */
export function typed(lesson: LearnLesson, lines: string[]): ShellState {
  let s = lessonShell(lesson)
  for (const l of lines) s = runShell(s, l).state
  return s
}
