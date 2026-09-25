/* ============================================================================
   Learn mode — building the checked program, and grading what it did
   ----------------------------------------------------------------------------
   Pure functions, shared by every language and both apps. The platform's own
   runtimes do the running (see platform.ts); this file decides what to run
   and what the result means, and shapes every check as a test case: what
   went in, what should have come out, and what did.

   `test` and `case` checks run inside her program. Her code runs first,
   unchanged, and a small harness appended after it evaluates each check and
   prints one marker line:

     @@LEARN <index> PASS | FAIL | ERROR <what it produced, or the error>

   Marker lines are taken out of the output she sees, and her line numbers
   are untouched because the harness only ever comes after her code. In C++
   the harness is main(): a C++ lesson with tests asks for functions, and the
   checker calls them. Helpers available to checks: `raises(ErrorType, fn)`
   in Python and `throws(fn)` in JavaScript and TypeScript.

   SQL checks are queries run after hers on the same database, found in the
   results by a marker row. Web checks run inside the rendered page, and
   terminal checks read the practice shell's state; neither needs a harness.
   ========================================================================== */
import { START, gitInfo, lookup, newShell, resolve, run as runShell, type ShellState } from '@/lib/shell'
import type { Cell, CheckResult, LearnCheck, LearnGrade, LearnLesson, LearnRun } from './types'

export const MARK = '@@LEARN'
const MARK_LINE = /^@@LEARN (\d+) (PASS|FAIL|ERROR)(?: (.*))?$/

/** An expression on one line: the harness puts each on its own line. */
function oneLine(expr: string): string {
  return expr.replace(/\s*\n\s*/g, ' ').trim()
}

type Indexed<K extends LearnCheck['kind']> = { c: Extract<LearnCheck, { kind: K }>; i: number }

function ofKind<K extends LearnCheck['kind']>(lesson: LearnLesson, kind: K): Indexed<K>[] {
  return lesson.checks.map((c, i) => ({ c, i })).filter((t): t is Indexed<K> => t.c.kind === kind)
}

const JS_HELPERS = `const throws = (f) => { try { f(); return false } catch { return true } }
  const __eq = (a, b) => { if (Object.is(a, b)) return true; if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null || Array.isArray(a) !== Array.isArray(b)) return false; const ka = Object.keys(a), kb = Object.keys(b); return ka.length === kb.length && ka.every((k) => __eq(a[k], b[k])) }
  const __show = (v) => { if (v === undefined) return 'undefined'; if (typeof v === 'function') return '[Function]'; if (typeof v === 'bigint') return v + 'n'; try { const j = JSON.stringify(v); return j === undefined ? String(v) : j } catch { return String(v) } }
  const __err = (e) => (e instanceof Error ? e.name + ': ' + e.message : String(e))
  const __learn = (i, f) => { try { const r = f(); console.log('${MARK} ' + i + (r ? ' PASS ' : ' FAIL ') + __show(r)) } catch (e) { console.log('${MARK} ' + i + ' ERROR ' + __err(e)) } }
  const __case = (i, f, w) => { try { const got = f(); console.log('${MARK} ' + i + (__eq(got, w()) ? ' PASS ' : ' FAIL ') + __show(got)) } catch (e) { console.log('${MARK} ' + i + ' ERROR ' + __err(e)) } }`

/** The same helpers, typed loosely enough to sit under strict TypeScript. */
const TS_HELPERS = JS_HELPERS.replace('(f) =>', '(f: () => unknown): boolean =>')
  .replace('const __eq = (a, b) =>', 'const __eq = (a: any, b: any): boolean =>')
  .replace('const __show = (v) =>', 'const __show = (v: unknown): string =>')
  .replace('const __err = (e) =>', 'const __err = (e: unknown): string =>')
  .replace('const __learn = (i, f) =>', 'const __learn = (i: number, f: () => unknown): void =>')
  .replace('const __case = (i, f, w) =>', 'const __case = (i: number, f: () => unknown, w: () => unknown): void =>')
  .replace('.every((k) =>', '.every((k: string) =>')

const CPP_HELPERS = `#include <cmath>
#include <iostream>
#include <map>
#include <memory>
#include <sstream>
#include <string>
#include <vector>
template <class T> std::string __learn_show(const T& v);
inline std::string __learn_show(const std::string& v) { std::string o = "\\""; for (char c : v) o += (c == '\\n' ? std::string("\\\\n") : std::string(1, c)); return o + "\\""; }
inline std::string __learn_show(const char* v) { return __learn_show(std::string(v)); }
inline std::string __learn_show(bool v) { return v ? "true" : "false"; }
inline std::string __learn_show(char v) { return std::string("'") + v + "'"; }
template <class T> std::string __learn_show(const std::vector<T>& v) { std::string o = "{"; for (std::size_t i = 0; i < v.size(); ++i) o += (i ? ", " : "") + __learn_show(v[i]); return o + "}"; }
template <class K, class V> std::string __learn_show(const std::map<K, V>& m) { std::string o = "{"; bool first = true; for (const auto& [k, x] : m) { o += (first ? "" : ", ") + std::string("{") + __learn_show(k) + ", " + __learn_show(x) + "}"; first = false; } return o + "}"; }
template <class T> std::string __learn_show(const T& v) { if constexpr (requires(std::ostream& os) { os << v; }) { std::ostringstream o; o << v; return o.str(); } else { return "(a value)"; } }`

function harness(lesson: LearnLesson): string {
  const tests = ofKind(lesson, 'test')
  const cases = ofKind(lesson, 'case')

  switch (lesson.lang) {
    case 'javascript':
    case 'typescript': {
      if (!tests.length && !cases.length) return ''
      const ts = lesson.lang === 'typescript'
      // Each call sits behind @ts-ignore, so a check that names something she
      // has not written yet fails when it runs (saying what is missing)
      // rather than as a type error in code she cannot see.
      const ign = ts ? '  // @ts-ignore\n' : ''
      const calls = [
        ...tests.map((t) => ({ i: t.i, line: `${ign}  __learn(${t.i}, () => (${oneLine(t.c.expr)}))` })),
        ...cases.map((t) => ({ i: t.i, line: `${ign}  __case(${t.i}, () => (${t.c.call}), () => (${oneLine(t.c.expect)}))` })),
      ]
        .sort((a, b) => a.i - b.i)
        .map((x) => x.line)
      return `\n;{\n  ${ts ? TS_HELPERS : JS_HELPERS}\n${calls.join('\n')}\n}\n`
    }
    case 'python': {
      if (!tests.length && !cases.length) return ''
      const calls = [
        ...tests.map((t) => ({ i: t.i, line: `__learn_test(${t.i}, lambda: (${oneLine(t.c.expr)}))` })),
        ...cases.map((t) => ({ i: t.i, line: `__learn_case(${t.i}, lambda: (${t.c.call}), lambda: (${oneLine(t.c.expect)}))` })),
      ]
        .sort((a, b) => a.i - b.i)
        .map((x) => x.line)
      return [
        '',
        '',
        'def raises(exc, fn):',
        '    try:',
        '        fn()',
        '    except exc:',
        '        return True',
        '    return False',
        '',
        'def __learn_same(a, b):',
        '    if isinstance(b, bool) or b is None:',
        '        return a is b',
        '    return type(a) is not bool and a == b',
        '',
        'def __learn_test(i, f):',
        '    try:',
        '        r = f()',
        `        print("${MARK} %d %s %r" % (i, "PASS" if r else "FAIL", r))`,
        '    except Exception as e:',
        `        print("${MARK} %d ERROR %s: %s" % (i, type(e).__name__, e))`,
        '',
        'def __learn_case(i, f, w):',
        '    try:',
        '        got = f()',
        `        print("${MARK} %d %s %r" % (i, "PASS" if __learn_same(got, w()) else "FAIL", got))`,
        '    except Exception as e:',
        `        print("${MARK} %d ERROR %s: %s" % (i, type(e).__name__, e))`,
        '',
        ...calls,
        '',
      ].join('\n')
    }
    case 'cpp': {
      if (!tests.length && !cases.length) return ''
      const lines = [
        ...tests.map((t) => ({
          i: t.i,
          line: `    { bool __r = (${oneLine(t.c.expr)}); std::cout << "${MARK} ${t.i} " << (__r ? "PASS " : "FAIL ") << __learn_show(__r) << std::endl; }`,
        })),
        ...cases.map((t) => ({
          i: t.i,
          line: `    { auto __v = (${t.c.call}); bool __ok = (__v == (${oneLine(t.c.expect)})); std::cout << "${MARK} ${t.i} " << (__ok ? "PASS " : "FAIL ") << __learn_show(__v) << std::endl; }`,
        })),
      ]
        .sort((a, b) => a.i - b.i)
        .map((x) => x.line)
      return `\n${CPP_HELPERS}\nint main() {\n${lines.join('\n')}\n    return 0;\n}\n`
    }
    case 'sql': {
      const queries = ofKind(lesson, 'query').map((q) => `SELECT '${MARK} ${q.i}' AS __learn;\n${q.c.sql.replace(/;\s*$/, '')};`)
      return `\n;\nSELECT '${MARK}' AS __learn;\n${queries.join('\n')}\n`
    }
    case 'html':
    case 'bash':
    case 'git':
      return ''
  }
}

/** Her code with the checks appended — what actually runs. */
export function buildProgram(lesson: LearnLesson, code: string): string {
  const h = harness(lesson)
  if (!h) return code
  return code.endsWith('\n') ? code + h.replace(/^\n/, '') : code + h
}

/** Web checks, in check order, as the page checker takes them. */
export function domSteps(lesson: LearnLesson): string[][] {
  return ofKind(lesson, 'dom').map((d) => d.c.steps)
}

/** Trailing space and blank lines at either end never decide a check. */
export function normalize(s: string): string {
  return s
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.trimEnd())
    .join('\n')
    .replace(/^\n+|\n+$/g, '')
}

interface Mark {
  status: 'PASS' | 'FAIL' | 'ERROR'
  message?: string
}

/** Splits the checker's marker lines out of what the program printed. */
export function splitMarks(stdout: string): { clean: string; marks: Map<number, Mark> } {
  const marks = new Map<number, Mark>()
  const kept: string[] = []
  for (const line of stdout.replace(/\r\n?/g, '\n').split('\n')) {
    const m = MARK_LINE.exec(line)
    if (m) marks.set(Number(m[1]), { status: m[2] as Mark['status'], ...(m[3] ? { message: m[3] } : {}) })
    else kept.push(line)
  }
  return { clean: kept.join('\n'), marks }
}

function sameCell(a: Cell, b: Cell): boolean {
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b))
  return a === b
}

function sameRows(want: Cell[][], got: Cell[][], ordered: boolean): boolean {
  if (want.length !== got.length) return false
  const key = (r: Cell[]) => JSON.stringify(r.map((c) => (typeof c === 'number' ? Number(c.toPrecision(12)) : c)))
  const a = ordered ? want : [...want].sort((x, y) => key(x).localeCompare(key(y)))
  const b = ordered ? got : [...got].sort((x, y) => key(x).localeCompare(key(y)))
  return a.every((r, i) => r.length === b[i]!.length && r.every((c, j) => sameCell(c, b[i]![j]!)))
}

export function showRows(rows: Cell[][]): string {
  if (!rows.length) return '(no rows)'
  const shown = rows.slice(0, 8).map((r) => r.map((c) => (c === null ? 'NULL' : String(c))).join(' | '))
  return shown.join('\n') + (rows.length > 8 ? `\n… ${rows.length - 8} more` : '')
}

function clip(s: string, n = 600): string {
  return s.length > n ? `${s.slice(0, n)}…` : s
}

/* ── Terminal facts ──────────────────────────────────────────────────────── */

/** Paths in facts are relative to ~/project unless they start with / or ~. */
const at = (p: string) => resolve(START, p)
const tilde = (p: string) => p.replace(/^\/home\/you/, '~')

/**
 * The shell a Terminal lesson starts in: its starter lines run as setup, then
 * forgotten, so `ran`, `used` and `printed` only ever see what she typed.
 */
export function lessonShell(lesson: LearnLesson): ShellState {
  let s = newShell()
  for (const line of lesson.starter.split('\n')) if (line.trim()) s = runShell(s, line).state
  return { ...s, history: [], transcript: [] }
}

/** Runs command lines one after another — how tests replay a solution. */
export function typeLines(s: ShellState, text: string): ShellState {
  for (const line of text.split('\n')) if (line.trim()) s = runShell(s, line).state
  return s
}

/** One fact about the practice shell; null when it holds, else what is wrong. */
export function checkFact(s: ShellState, fact: string): string | null {
  const words = fact.trim().split(/\s+/)
  const [what, arg = ''] = words
  const tail = words.slice(2).join(' ')
  switch (what) {
    case 'cwd':
      return s.cwd === at(arg) ? null : `you are in ${tilde(s.cwd)}, not ${tilde(at(arg))}`
    case 'dir': {
      const n = lookup(s, at(arg))
      return n?.kind === 'dir' ? null : n ? `${arg} is a file, not a folder` : `there is no folder ${arg}`
    }
    case 'missing':
      return lookup(s, at(arg)) ? `${arg} should not exist any more` : null
    case 'file': {
      const n = lookup(s, at(arg))
      if (!n) return `there is no file ${arg}`
      if (n.kind !== 'file') return `${arg} is a folder, not a file`
      if (!tail) return null
      const m = /^(==|contains)\s+(.*)$/.exec(tail)
      if (!m) return `the check "${fact}" could not be read`
      const got = n.content.replace(/\n$/, '')
      if (m[1] === '==') return got === m[2] ? null : `${arg} contains ${JSON.stringify(got)}, not ${JSON.stringify(m[2])}`
      return got.includes(m[2]!) ? null : `${arg} does not contain ${JSON.stringify(m[2])}`
    }
    case 'ran': {
      const want = words.slice(1).join(' ')
      const cmds = s.history.flatMap((h) => h.split('&&').map((c) => c.trim().replace(/\s+/g, ' ')))
      return cmds.some((c) => c === want || c.startsWith(`${want} `)) ? null : `you have not run ${want} yet`
    }
    case 'used': {
      const want = words.slice(1).join(' ')
      return s.history.some((h) => h.includes(want)) ? null : `you have not used ${want} in a command yet`
    }
    case 'printed-line': {
      const want = words.slice(1).join(' ')
      return s.transcript.some((t) => t.out.split('\n').includes(want)) ? null : `nothing has printed the line ${JSON.stringify(want)} yet`
    }
    case 'printed': {
      const want = words.slice(1).join(' ')
      return s.transcript.some((t) => t.out.includes(want)) ? null : `nothing has printed ${JSON.stringify(want)} yet`
    }
    case 'git': {
      const info = gitInfo(s, at(arg))
      const [, , prop, ...rest] = words
      if (!info) return `${arg === '.' ? '~/project' : arg} is not a git repository yet`
      switch (prop) {
        case 'repo':
          return null
        case 'commits': {
          const n = Number(rest[1])
          const holds = rest[0] === '>=' ? info.commits >= n : info.commits === n
          return holds ? null : `the repository has ${info.commits} commit${info.commits === 1 ? '' : 's'}`
        }
        case 'branch':
          return info.branch === rest[0] ? null : `you are on ${info.branch}, not ${rest[0]}`
        case 'has-branch':
          return info.branches.includes(rest[0]!) ? null : `there is no branch ${rest[0]}`
        case 'staged':
          return info.staged.includes(rest[0]!) ? null : `${rest[0]} is not staged`
        case 'untracked':
          return info.untracked.includes(rest[0]!) ? null : `${rest[0]} is not an untracked file`
        case 'modified':
          return info.modified.includes(rest[0]!) ? null : `${rest[0]} has no unstaged changes`
        case 'commits-on': {
          const n = Number(rest[2])
          const got = info.branchCommits[rest[0]!]
          if (got === undefined) return `there is no branch ${rest[0]}`
          const holds = rest[1] === '>=' ? got >= n : got === n
          return holds ? null : `${rest[0]} has ${got} commit${got === 1 ? '' : 's'}`
        }
        case 'merges': {
          const n = Number(rest[1])
          const holds = rest[0] === '>=' ? info.merges >= n : info.merges === n
          return holds ? null : `the history has ${info.merges} merge commit${info.merges === 1 ? '' : 's'}`
        }
        case 'log': {
          const want = rest.slice(1).join(' ')
          return info.messages.some((m) => m.includes(want)) ? null : `no commit message contains ${JSON.stringify(want)}`
        }
        case 'clean':
          return info.staged.length ? `still staged: ${info.staged.join(', ')}` : null
        default:
          return `the check "${fact}" could not be read`
      }
    }
    default:
      return `the check "${fact}" could not be read`
  }
}

/* ── Grading ─────────────────────────────────────────────────────────────── */

/** Grades one run of a lesson. */
export function gradeRun(lesson: LearnLesson, code: string, run: LearnRun): LearnGrade {
  const { clean, marks } = splitMarks(run.stdout)

  // SQL: her result sets come before the marker row; each query check's
  // result follows its own marker.
  let tables = run.tables ?? []
  const queryTables = new Map<number, Cell[][]>()
  if (lesson.lang === 'sql') {
    const atMark = tables.findIndex((t) => t.columns.length === 1 && t.columns[0] === '__learn' && t.rows[0]?.[0] === MARK)
    const after = atMark >= 0 ? tables.slice(atMark + 1) : []
    for (let k = 0; k < after.length; k++) {
      const t = after[k]!
      const m = t.columns[0] === '__learn' ? /^@@LEARN (\d+)$/.exec(String(t.rows[0]?.[0] ?? '')) : null
      if (!m) continue
      const next = after[k + 1]
      const isMarker = next && next.columns[0] === '__learn'
      queryTables.set(Number(m[1]), next && !isMarker ? next.rows : [])
    }
    if (atMark >= 0) tables = tables.slice(0, atMark)
  }

  const domIndex = new Map(ofKind(lesson, 'dom').map((d, j) => [d.i, j]))
  const didNotRun = run.error ? 'Did not run — fix the error shown in the console first.' : null
  const got = normalize(clean)

  const results: CheckResult[] = lesson.checks.map((c, i): CheckResult => {
    const base = { name: c.name, ...(c.hint ? { hint: c.hint } : {}) }
    const res = (pass: boolean, view: Partial<CheckResult> = {}): CheckResult => ({ ...base, status: pass ? 'pass' : 'fail', ...view })

    if (c.kind === 'source') {
      const hit = new RegExp(c.pattern, 'm').test(code)
      return res(hit !== c.absent)
    }
    if (c.kind === 'shell') {
      if (!run.shell) return res(false, { detail: 'The terminal has not been used yet.' })
      const failing = c.facts.map((f) => checkFact(run.shell!, f)).find((e) => e !== null)
      return res(!failing, { input: c.facts.join('\n'), ...(failing ? { actual: failing } : {}) })
    }
    if (c.kind === 'dom') {
      const r = run.dom?.[domIndex.get(i) ?? -1]
      if (didNotRun) return res(false, { input: c.steps.join('\n'), detail: didNotRun })
      if (!r) return res(false, { input: c.steps.join('\n'), detail: 'The page did not finish loading, so this was not checked.' })
      return res(r.pass, { input: c.steps.join('\n'), ...(r.detail ? { actual: r.detail } : {}) })
    }
    if (didNotRun) {
      const input = c.kind === 'case' ? c.call : c.kind === 'test' ? oneLine(c.expr) : c.kind === 'query' ? c.sql : lesson.stdin?.trim()
      return res(false, { detail: didNotRun, ...(input ? { input } : {}) })
    }

    switch (c.kind) {
      case 'output': {
        const want = normalize(c.expect)
        return res(want === got, { input: lesson.stdin?.trim() || '(no input)', expected: clip(want), actual: clip(got) || '(nothing printed)' })
      }
      case 'includes': {
        const missing = c.expect.filter((e) => !got.includes(normalize(e)))
        return res(!missing.length, {
          expected: c.expect.join('\n'),
          actual: clip(got) || '(nothing printed)',
          ...(missing.length ? { detail: `Not in the output: ${missing.map((m) => `“${m}”`).join(', ')}` } : {}),
        })
      }
      case 'test':
      case 'case': {
        const m = marks.get(i)
        const input = c.kind === 'case' ? c.call : oneLine(c.expr)
        const expected = c.kind === 'case' ? c.expect : 'true'
        if (!m) return res(false, { input, expected, detail: 'This check never ran: the program stopped before it got there.' })
        if (m.status === 'ERROR') return res(false, { input, expected, actual: m.message ?? 'an error' })
        return res(m.status === 'PASS', { input, expected, actual: m.message ?? '' })
      }
      case 'result': {
        const last = tables[tables.length - 1]
        const expected = showRows(c.rows) + (c.ordered ? '\n(in this order)' : '')
        if (!last) return res(false, { expected, actual: '(no rows)', detail: 'Your SQL did not return any rows. The last statement should be a SELECT.' })
        return res(sameRows(c.rows, last.rows, c.ordered), { expected, actual: showRows(last.rows) })
      }
      case 'query': {
        const rows = queryTables.get(i)
        if (!rows) return res(false, { input: c.sql, detail: 'This check never ran.' })
        return res(sameRows(c.rows, rows, true), { input: c.sql, expected: showRows(c.rows), actual: showRows(rows) })
      }
    }
  })

  return {
    passed: results.every((r) => r.status === 'pass'),
    results,
    output: clean.replace(/\n+$/, lesson.lang === 'sql' ? '' : '\n').replace(/^\n$/, ''),
    stderr: run.stderr,
    error: run.error,
    tables,
    ms: run.ms,
  }
}
