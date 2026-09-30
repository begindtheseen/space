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

/* ── Code: Python, SQL and C++ ───────────────────────────────────────────── */

export interface CodeMistake {
  name: string
  code: string
  expect: DiagnosisKind[]
  mention?: RegExp
}

const lineIdx = (src: string, re: RegExp): number => src.split('\n').findIndex((l) => re.test(l))
const withLine = (src: string, i: number, f: (l: string) => string) => src.split('\n').map((l, k) => (k === i ? f(l) : l)).join('\n')

/** Identifiers assigned in the code, and used again later: good ones to misspell at a use. */
function usedNames(src: string): string[] {
  const assigned = [...src.matchAll(/^\s*([a-z_][a-z0-9_]{3,})\s*=(?!=)/gm)].map((m) => m[1]!)
  return [...new Set(assigned)].filter((n) => src.split(new RegExp(`\\b${n}\\b`)).length > 2)
}

export function codeMistakesFor(unit: LearnLesson): CodeMistake[] {
  const src = unit.solution.replace(/\s+$/, '')
  const out: CodeMistake[] = []
  const add = (name: string, code: string | null, expect: DiagnosisKind[], mention?: RegExp) => {
    if (code && code !== src && code.trim() !== unit.starter.trim()) out.push({ name, code, expect, ...(mention ? { mention } : {}) })
  }
  if (unit.lang === 'python') {
    const colon = lineIdx(src, /^\s*(if|for|while|def|elif)\b.*:\s*$/)
    if (colon >= 0) add('py-colon', withLine(src, colon, (l) => l.replace(/:\s*$/, '')), ['error'], /colon/)
    const body = src.split('\n').findIndex((l, k, all) => k > 0 && /:\s*$/.test(all[k - 1]!) && /^\s{4,}\S/.test(l) && (all[k + 1] ?? '').match(/^\s*/)![0].length >= l.match(/^\s*/)![0].length)
    if (body >= 0) add('py-indent', withLine(src, body, (l) => l.replace(/^ {4}/, '')), ['error'], /spac|push/)
    const n = usedNames(src)[0]
    if (n) {
      const lines = src.split('\n')
      const use = lines.findIndex((l) => new RegExp(`\\b${n}\\b`).test(l) && !new RegExp(`^\\s*${n}\\s*=(?!=)`).test(l))
      if (use >= 0) add('py-name', withLine(src, use, (l) => l.replace(new RegExp(`\\b${n}\\b`), n.slice(0, -1))), ['error', 'case'], new RegExp(`\`${n}\``))
    }
    if (/\bprint\(/.test(src)) add('py-print-case', src.replace(/\bprint\(/, 'Print('), ['error'], /`print`/)
    const q = lineIdx(src, /print\("[^"]+"\)/)
    if (q >= 0) add('py-quote', withLine(src, q, (l) => l.replace(/"\)/, ')')), ['error'], /quote|never closes/)
    const f = lineIdx(src, /\bf"[^"]*\{[^}]+\}[^"]*"/)
    if (f >= 0) add('py-fstring', withLine(src, f, (l) => l.replace(/\bf"/, '"')), ['logic'], /`f`/)
    const ret = lineIdx(src, /^\s{4}return\s+\S/)
    if (ret >= 0 && unit.checks.some((c) => c.kind === 'case')) add('py-return-print', withLine(src, ret, (l) => l.replace(/return\s+(.+)$/, 'print($1)')), ['case', 'logic'], /return|give/)
    // The last return pushed one step in, into the block just above it: a loop, or an if.
    const pushed = src.split('\n').findIndex((l, k, all) => /^ {4}return\b/.test(l) && /^ {8}\S/.test(all[k - 1] ?? ''))
    if (pushed >= 0) {
      const block = src.split('\n').slice(0, pushed).findLast((p) => /^ {4}\S/.test(p)) ?? ''
      if (/^ {4}(?:for|while)\b.*:\s*$/.test(block)) add('py-return-in-loop', withLine(src, pushed, (l) => `    ${l}`), ['logic', 'case', 'output'], /loop/)
      else if (/^ {4}(?:if|elif|else)\b.*:\s*$/.test(block)) add('py-return-in-if', withLine(src, pushed, (l) => `    ${l}`), ['logic', 'case', 'output'], /inside `(?:if|elif|else)/)
    }
    if (/int\(input\(\)\)/.test(src)) add('py-int-input', src.replace(/int\(input\(\)\)/, 'input()'), ['logic', 'error'], /int|text/)
    const qv = src.split('\n').findIndex((l) => { const m = /^\s*print\(([a-z_][a-z0-9_]*)\)\s*$/.exec(l); return !!m && usedNames(src).includes(m[1]!) })
    if (qv >= 0) add('py-quoted-var', withLine(src, qv, (l) => l.replace(/print\((\w+)\)/, 'print("$1")')), ['logic'], /quote/)
    const loopPrint = src.split('\n').findIndex((l, k, all) => /^ {4}print\(/.test(l) && /^for\b.*:\s*$/.test(all[k - 1] ?? '') && !/^ {4}/.test(all[k + 1] ?? ''))
    if (loopPrint >= 0) add('py-print-outside', withLine(src, loopPrint, (l) => l.replace(/^ {4}/, '')), ['logic', 'output'], /loop/)
    const eq = lineIdx(src, /^\s*(if|elif|while)\b.*==/)
    if (eq >= 0) add('py-eq', withLine(src, eq, (l) => l.replace('==', '=')), ['error'], /equals|==/)
    const div = lineIdx(src, /[^/]\/\/[^/]/)
    if (div >= 0) add('py-div', withLine(src, div, (l) => l.replace('//', '/')), ['logic', 'output', 'case'])
    const call = src.split('\n').findIndex((l) => /^print\([a-z_]\w*\(.*\)\)\s*$/.test(l))
    if (call >= 0 && /^def /m.test(src)) add('py-no-call', src.split('\n').filter((l) => !/^print\([a-z_]\w*\(.*\)\)\s*$/.test(l)).join('\n'), ['logic', 'empty', 'output'], /call/)
  }
  // A recursive query without its stopping condition never ends: leave those alone.
  if (unit.lang === 'sql' && !/\bRECURSIVE\b/i.test(src)) {
    // The first column named after a SELECT: a name, not a keyword or a function.
    const col = [...src.matchAll(/\bSELECT\s+(?:[a-z]\w*\.)?([a-z_]{4,})\b(?!\s*\()/gi)].map((m) => m[1]!).find((c) => c === c.toLowerCase() && !/^(?:distinct|case|count|null|true|false)$/i.test(c))
    if (col) add('sql-column', src.replace(new RegExp(`(\\bSELECT\\s+(?:[a-z]\\w*\\.)?)${col}\\b`, 'i'), `$1${col.slice(0, -1)}`), ['error', 'spelling'], new RegExp(`\`${col}\``))
    const table = /FROM\s+([a-z_]{4,})/i.exec(src)?.[1]
    if (table) add('sql-table', src.replace(new RegExp(`FROM\\s+${table}\\b`, 'i'), `FROM ${table.slice(0, -1)}`), ['error', 'spelling'], new RegExp(`\`${table}\``))
    if (/\bIS NULL\b/i.test(src)) add('sql-null', src.replace(/\bIS NULL\b/i, '= NULL'), ['logic'], /IS NULL/)
    const str = /(=|IN\s*\(|LIKE)\s*'([A-Za-z]+)'/.exec(src)
    if (str) add('sql-quotes', src.replace(`'${str[2]}'`, str[2]!), ['logic', 'error'], /single quote/)
    if (/\bGROUP BY\b[^;]*?(?=\bHAVING\b|\bORDER\b|;|$)/i.test(src) && /\b(COUNT|SUM|AVG|MIN|MAX)\(/i.test(src)) add('sql-group', src.replace(/\s*\bGROUP BY\s+[\w., ]+?(?=\s*(?:\bHAVING\b|\bORDER\b|;|$))/i, ''), ['logic', 'rows'], /GROUP BY/)
    if (/\bLIMIT\s+\d+/i.test(src)) add('sql-limit', src.replace(/\s*\bLIMIT\s+\d+/i, ''), ['logic', 'rows'], /LIMIT/)
    const sel = /SELECT\s+([\w.]+)\s*,\s*([\w.]+)\s+FROM/i.exec(src)
    if (sel) add('sql-columns', src.replace(`${sel[1]}, ${sel[2]}`, `${sel[2]}, ${sel[1]}`).replace(`${sel[1]},${sel[2]}`, `${sel[2]},${sel[1]}`), ['logic', 'rows', 'error'], /order|columns/)
    // Only a WHERE of the main query, and only what belongs to it: never across a bracket.
    const where = [...src.matchAll(/\s*\bWHERE\b[^;()]*?(?=\bGROUP\b|\bORDER\b|\bLIMIT\b|;|$)/gi)].find((m) => {
      const before = src.slice(0, m.index)
      return (before.match(/\(/g) ?? []).length === (before.match(/\)/g) ?? []).length
    })
    if (where) add('sql-where', src.slice(0, where.index) + ' ' + src.slice(where.index! + where[0].length), ['rows', 'logic'])
    if (/\bDESC\b/i.test(src)) add('sql-desc', src.replace(/\s*\bDESC\b/i, ''), ['rows', 'logic'], /order|DESC/i)
    if (/\bJOIN\s+\w+(?:\s+\w+)?\s+ON\s+[\w.]+\s*=\s*[\w.]+/i.test(src)) add('sql-join-on', src.replace(/(\bJOIN\s+\w+(?:\s+\w+)?)\s+ON\s+[\w.]+\s*=\s*[\w.]+/i, '$1'), ['logic', 'rows', 'error'], /ON|join/i)
  }
  if (unit.lang === 'cpp') {
    const semi = lineIdx(src, /^\s*(int|double|auto|std::cout|cout|return)\b[^;{]*;\s*$/)
    if (semi >= 0) add('cpp-semicolon', withLine(src, semi, (l) => l.replace(/;\s*$/, '')), ['error'], /semicolon/)
    const decl = /\b(?:int|double|auto|long)\s+([a-z_]\w{3,})\s*=/.exec(src)?.[1]
    if (decl) {
      const lines = src.split('\n')
      const use = lines.findIndex((l) => new RegExp(`\\b${decl}\\b`).test(l) && !new RegExp(`\\b(?:int|double|auto|long)\\s+${decl}\\b`).test(l))
      if (use >= 0) add('cpp-name', withLine(src, use, (l) => l.replace(new RegExp(`\\b${decl}\\b`), decl.slice(0, -1))), ['error'], new RegExp(`\`${decl}\``))
    }
    if (/std::cout/.test(src) && !/using namespace std/.test(src)) add('cpp-std', src.replace(/std::cout/, 'cout'), ['error'], /std::/)
    if (/#include <iostream>/.test(src)) add('cpp-include', src.replace(/#include <iostream>\n?/, ''), ['error'], /include|iostream/)
    const ifEq = lineIdx(src, /if\s*\([^)]*==/)
    if (ifEq >= 0) add('cpp-assign-if', withLine(src, ifEq, (l) => l.replace('==', '=')), ['logic', 'output', 'case', 'error'], /==|equals/)
    if (/<<\s*(?:'\\n'|"\\n"|std::endl|endl)/.test(src)) add('cpp-newline', src.replace(/\s*<<\s*(?:'\\n'|"\\n"|std::endl|endl)/g, ''), ['logic', 'output'], /line|\\n|endl/)
    const lt = lineIdx(src, /for\s*\([^;]*;\s*\w+\s*<\s*[\w.()]+\s*;/)
    if (lt >= 0) add('cpp-bound', withLine(src, lt, (l) => l.replace(/(;\s*\w+\s*)<(\s*)/, '$1<=$2')), ['logic', 'output', 'case', 'error'])
  }
  return out
}
