/* ============================================================================
   Learn mode — building the checked program, and grading what it did
   ----------------------------------------------------------------------------
   Pure functions, shared by every language and both apps. The platform's own
   runtimes do the running (see run.ts); this file only decides what to run
   and what the result means.

   A `test` check is an expression in the lesson's language. Her code runs
   first, unchanged, and a small harness appended after it evaluates each
   expression and prints one marker line per check:

     @@LEARN <index> PASS | FAIL | ERROR <message>

   Two helpers exist for checks to use: `raises(ErrorType, fn)` in Python and
   `throws(fn)` in JavaScript and TypeScript, true when calling fn raises.

   Marker lines are taken out of the output she sees. Her own line numbers
   are untouched, because the harness only ever comes after her code.

   In C++ the harness is main(): a C++ lesson with tests asks her for
   functions, and the checker calls them. SQL has no expressions to test;
   there a check is a query run after hers, on the same database, found in
   the results by a marker row placed in front of it.
   ========================================================================== */
import type { Cell, CheckResult, LearnGrade, LearnLesson, LearnRun } from './types'

export const MARK = '@@LEARN'
const MARK_LINE = /^@@LEARN (\d+) (PASS|FAIL|ERROR)(?: (.*))?$/

/** A test expression on one line: the harness puts each on its own line. */
function oneLine(expr: string): string {
  return expr.replace(/\s*\n\s*/g, ' ').trim()
}

function harness(lesson: LearnLesson): string {
  const tests = lesson.checks
    .map((c, i) => ({ c, i }))
    .filter((t): t is { c: Extract<LearnLesson['checks'][number], { kind: 'test' }>; i: number } => t.c.kind === 'test')

  switch (lesson.lang) {
    case 'javascript':
    case 'typescript': {
      if (!tests.length) return ''
      const ts = lesson.lang === 'typescript'
      // Each call is on its own line behind @ts-ignore, so a check that names
      // something she has not written yet fails when it runs (with a message
      // saying what is missing) rather than as a type error in code she
      // cannot see.
      const throws = ts
        ? `const throws = (f: () => unknown): boolean => { try { f(); return false } catch { return true } }`
        : `const throws = (f) => { try { f(); return false } catch { return true } }`
      const def = ts
        ? `const __learn = (i: number, f: () => unknown): void => { try { console.log('${MARK} ' + i + (f() ? ' PASS' : ' FAIL')) } catch (e) { console.log('${MARK} ' + i + ' ERROR ' + (e instanceof Error ? e.message : String(e))) } }`
        : `const __learn = (i, f) => { try { console.log('${MARK} ' + i + (f() ? ' PASS' : ' FAIL')) } catch (e) { console.log('${MARK} ' + i + ' ERROR ' + (e instanceof Error ? e.message : String(e))) } }`
      const calls = tests.map((t) => `${ts ? '  // @ts-ignore\n' : ''}  __learn(${t.i}, () => (${oneLine(t.c.expr)}))`)
      return `\n;{\n  ${throws}\n  ${def}\n${calls.join('\n')}\n}\n`
    }
    case 'python': {
      if (!tests.length) return ''
      const fns = tests.map((t) => `        (${t.i}, lambda: (${oneLine(t.c.expr)})),`)
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
        'def __learn_checks():',
        '    for __i, __f in [',
        ...fns,
        '    ]:',
        '        try:',
        `            print("${MARK} %d %s" % (__i, "PASS" if __f() else "FAIL"))`,
        '        except Exception as __e:',
        `            print("${MARK} %d ERROR %s: %s" % (__i, type(__e).__name__, __e))`,
        '',
        '__learn_checks()',
        '',
      ].join('\n')
    }
    case 'cpp': {
      if (!tests.length) return ''
      const lines = tests.map(
        (t) => `    std::cout << "${MARK} ${t.i} " << ((${oneLine(t.c.expr)}) ? "PASS" : "FAIL") << std::endl;`,
      )
      // The headers a check expression may lean on, whatever hers included.
      const headers = ['cmath', 'iostream', 'map', 'memory', 'string', 'vector'].map((h) => `#include <${h}>`).join('\n')
      return `\n${headers}\nint main() {\n${lines.join('\n')}\n    return 0;\n}\n`
    }
    case 'sql': {
      const queries = lesson.checks
        .map((c, i) => ({ c, i }))
        .filter((q) => q.c.kind === 'query')
        .map((q) => `SELECT '${MARK} ${q.i}' AS __learn;\n${(q.c as { sql: string }).sql.replace(/;\s*$/, '')};`)
      return `\n;\nSELECT '${MARK}' AS __learn;\n${queries.join('\n')}\n`
    }
  }
}

/** Her code with the checks appended — what actually runs. */
export function buildProgram(lesson: LearnLesson, code: string): string {
  const h = harness(lesson)
  if (!h) return code
  return code.endsWith('\n') ? code + h.replace(/^\n/, '') : code + h
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

function showRows(rows: Cell[][]): string {
  if (!rows.length) return '(no rows)'
  const shown = rows.slice(0, 8).map((r) => r.map((c) => (c === null ? 'NULL' : String(c))).join(' | '))
  return shown.join('\n') + (rows.length > 8 ? `\n… ${rows.length - 8} more` : '')
}

function clip(s: string, n = 400): string {
  return s.length > n ? `${s.slice(0, n)}…` : s
}

/** Grades one run of a lesson. */
export function gradeRun(lesson: LearnLesson, code: string, run: LearnRun): LearnGrade {
  const { clean, marks } = splitMarks(run.stdout)

  // SQL: her result sets come before the marker row; each query check's
  // result follows its own marker.
  let tables = run.tables ?? []
  const queryTables = new Map<number, Cell[][]>()
  if (lesson.lang === 'sql') {
    const at = tables.findIndex((t) => t.columns.length === 1 && t.columns[0] === '__learn' && t.rows[0]?.[0] === MARK)
    const after = at >= 0 ? tables.slice(at + 1) : []
    for (let k = 0; k < after.length; k++) {
      const t = after[k]!
      const m = t.columns[0] === '__learn' ? /^@@LEARN (\d+)$/.exec(String(t.rows[0]?.[0] ?? '')) : null
      if (!m) continue
      const next = after[k + 1]
      const isMarker = next && next.columns[0] === '__learn'
      queryTables.set(Number(m[1]), next && !isMarker ? next.rows : [])
    }
    if (at >= 0) tables = tables.slice(0, at)
  }

  const didNotRun = run.error ? 'Did not run — fix the error shown in the output first.' : null

  const results: CheckResult[] = lesson.checks.map((c, i): CheckResult => {
    const base = { name: c.name, ...(c.hint ? { hint: c.hint } : {}) }
    const pass = (): CheckResult => ({ ...base, status: 'pass' })
    const failed = (detail?: string): CheckResult => ({ ...base, status: 'fail', ...(detail ? { detail } : {}) })

    if (c.kind === 'source') {
      const hit = new RegExp(c.pattern, 'm').test(code)
      return hit !== c.absent ? pass() : failed()
    }
    if (didNotRun) return failed(didNotRun)

    switch (c.kind) {
      case 'output': {
        const want = normalize(c.expect)
        const got = normalize(clean)
        return want === got ? pass() : failed(`Expected:\n${clip(want)}\n\nYour program printed:\n${clip(got) || '(nothing)'}`)
      }
      case 'includes': {
        const got = normalize(clean)
        const missing = c.expect.filter((e) => !got.includes(normalize(e)))
        return missing.length ? failed(`Not in the output: ${missing.map((m) => `“${m}”`).join(', ')}`) : pass()
      }
      case 'test': {
        const m = marks.get(i)
        if (!m) return failed('This check never ran: the program stopped before it got there.')
        if (m.status === 'PASS') return pass()
        if (m.status === 'ERROR') return failed(m.message ? `It raised an error: ${m.message}` : 'It raised an error.')
        return failed(`Checked: ${oneLine(c.expr)}\nIt came out false.`)
      }
      case 'result': {
        const last = tables[tables.length - 1]
        if (!last) return failed('Your SQL did not return any rows. The last statement should be a SELECT.')
        return sameRows(c.rows, last.rows, c.ordered)
          ? pass()
          : failed(`Expected${c.ordered ? ', in this order' : ''}:\n${showRows(c.rows)}\n\nYour query returned:\n${showRows(last.rows)}`)
      }
      case 'query': {
        const got = queryTables.get(i)
        if (!got) return failed('This check never ran.')
        return sameRows(c.rows, got, true) ? pass() : failed(`Expected:\n${showRows(c.rows)}\n\nFound:\n${showRows(got)}`)
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
