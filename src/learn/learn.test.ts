import { describe, expect, it } from 'vitest'
import { buildProgram, gradeRun, normalize, splitMarks } from './grade'
import { TRACKS, findLesson, nextLesson } from './index'
import { LEARN_LANGS } from './platform'
import { LessonFormatError, parseTrack } from './parse'
import type { LearnLesson } from './types'

const lesson = (over: Partial<LearnLesson>): LearnLesson => ({
  id: 'x-01',
  lang: 'javascript',
  title: 'T',
  teach: '',
  task: '',
  starter: '',
  solution: '',
  hints: [],
  checks: [],
  ...over,
})

describe('the tracks', () => {
  it('every language this app teaches has a track that parses', () => {
    expect(TRACKS.map((t) => t.lang)).toEqual(LEARN_LANGS)
    expect(LEARN_LANGS).toEqual(expect.arrayContaining(['python', 'sql', 'cpp']))
  })

  it('each track covers the basics: at least ten lessons', () => {
    for (const t of TRACKS) expect(t.lessons.length, t.lang).toBeGreaterThanOrEqual(10)
  })

  it('lesson ids are unique across every track', () => {
    const ids = TRACKS.flatMap((t) => t.lessons.map((l) => l.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every lesson teaches, sets a task, has a solution and a hint, and checks something real', () => {
    for (const t of TRACKS) {
      for (const l of t.lessons) {
        expect(l.teach.length, l.id).toBeGreaterThan(80)
        expect(l.task.length, l.id).toBeGreaterThan(20)
        expect(l.solution.trim().length, l.id).toBeGreaterThan(0)
        expect(l.hints.length, l.id).toBeGreaterThan(0)
        // A lesson graded only on its source text would be a string match.
        expect(l.checks.some((c) => c.kind !== 'source'), l.id).toBe(true)
      }
    }
  })

  it('C++ lessons with tests do not ask for main — the checker supplies it', () => {
    for (const l of TRACKS.find((t) => t.lang === 'cpp')?.lessons ?? []) {
      if (!l.checks.some((c) => c.kind === 'test')) continue
      expect(/\bint\s+main\s*\(/.test(l.solution), l.id).toBe(false)
    }
  })

  it('SQL lessons all have a database', () => {
    for (const l of TRACKS.find((t) => t.lang === 'sql')?.lessons ?? []) expect(l.schema, l.id).toContain('CREATE TABLE')
  })

  it('continue goes to the first lesson not yet passed', () => {
    const py = TRACKS.find((t) => t.lang === 'python')!
    expect(nextLesson(py, {}).id).toBe('py-01')
    expect(nextLesson(py, { 'py-01': 'x', 'py-02': 'x' }).id).toBe('py-03')
    expect(findLesson('py-03')?.index).toBe(2)
  })
})

describe('the lesson format', () => {
  const head = '@track python\n@title Python\n\n'

  it('parses a lesson with every section', () => {
    const t = parseTrack(
      head +
        '=== p-1 | One\n--- teach\nText\n--- task\nDo it\n--- starter\nx = 1\n--- solution\nx = 2\n\n--- hint\nH1\n--- hint\nH2\n' +
        '--- check test | x is 2\nx == 2\n?? look at x\n--- check source absent | no literal\nprint\\(2\\)\n',
    )
    const l = t.lessons[0]!
    expect(l.solution).toBe('x = 2\n')
    expect(l.hints).toEqual(['H1', 'H2'])
    expect(l.checks[0]).toEqual({ kind: 'test', name: 'x is 2', expr: 'x == 2', hint: 'look at x' })
    expect(l.checks[1]).toMatchObject({ kind: 'source', absent: true })
  })

  it('treats a SQL comment or a markdown rule as content, not structure', () => {
    const t = parseTrack(head + '=== p-1 | One\n--- teach\nabove\n---\nbelow\n--- task\nt\n--- solution\n--- a comment\nx = 1\n--- check output | o\n1\n')
    expect(t.lessons[0]!.teach).toBe('above\n---\nbelow')
    expect(t.lessons[0]!.solution).toBe('--- a comment\nx = 1\n')
  })

  it('reads SQL result and query checks', () => {
    const t = parseTrack(
      '@track sql\n@title SQL\n@schema\nCREATE TABLE t (a);\n@end\n=== s-1 | One\n--- teach\nx\n--- task\nt\n--- solution\nSELECT 1;\n' +
        '--- check result | r\nordered\n[[1, "a", null]]\n--- check query | q\nSELECT COUNT(*) FROM t\n=> [[0]]\n',
    )
    const l = t.lessons[0]!
    expect(l.schema).toBe('CREATE TABLE t (a);')
    expect(l.checks[0]).toMatchObject({ kind: 'result', ordered: true, rows: [[1, 'a', null]] })
    expect(l.checks[1]).toMatchObject({ kind: 'query', sql: 'SELECT COUNT(*) FROM t', rows: [[0]] })
  })

  it('names the lesson at fault when a file is malformed', () => {
    expect(() => parseTrack(head + '=== p-9 | Bad\n--- teach\nx\n--- task\nt\n--- solution\ny\n')).toThrow(/p-9.*check/)
    expect(() => parseTrack(head + '=== p-9 | Bad\n--- teach\nx\n--- task\nt\n--- solution\ny\n--- check nope | n\nz\n')).toThrow(
      LessonFormatError,
    )
  })
})

describe('grading', () => {
  it('ignores trailing space and blank lines at the ends, nothing else', () => {
    expect(normalize('\n a  \nb\r\n\n')).toBe(' a\nb')
  })

  it('appends the checks after her code, leaving her line numbers alone', () => {
    const l = lesson({ checks: [{ kind: 'test', name: 'adds', expr: 'add(2, 3) === 5' }] })
    const p = buildProgram(l, 'const add = (a, b) => a + b\n')
    expect(p.startsWith('const add = (a, b) => a + b\n')).toBe(true)
    expect(p).toContain('__learn(0, () => (add(2, 3) === 5))')
  })

  it('marks every TypeScript check call so a name she has not written fails at run time, not as a type error', () => {
    const l = lesson({ lang: 'typescript', checks: [{ kind: 'test', name: 'n', expr: 'f()' }] })
    expect(buildProgram(l, 'let a = 1\n')).toMatch(/\/\/ @ts-ignore\n\s*__learn\(0/)
  })

  it('gives C++ checks a main of their own', () => {
    const l = lesson({ lang: 'cpp', checks: [{ kind: 'test', name: 'n', expr: 'f() == 2' }] })
    const p = buildProgram(l, 'int f() { return 2; }\n')
    expect(p).toMatch(/int main\(\) \{\n\s+std::cout << "@@LEARN 0 " << \(\(f\(\) == 2\)/)
  })

  it('takes the checker lines out of the output she sees', () => {
    const { clean, marks } = splitMarks('hi\n@@LEARN 0 PASS\n@@LEARN 1 ERROR ReferenceError: add is not defined\nbye\n')
    expect(clean).toBe('hi\nbye\n')
    expect(marks.get(1)).toEqual({ status: 'ERROR', message: 'ReferenceError: add is not defined' })
  })

  it('passes only when every check passes', () => {
    const l = lesson({
      checks: [
        { kind: 'output', name: 'o', expect: 'hi' },
        { kind: 'test', name: 't', expr: 'x' },
        { kind: 'source', name: 's', pattern: 'console\\.log', absent: false },
      ],
    })
    const run = { stdout: 'hi\n@@LEARN 1 PASS\n', stderr: '', error: null, ms: 1 }
    expect(gradeRun(l, "console.log('hi')", run).passed).toBe(true)
    const wrong = gradeRun(l, "console.log('hi')", { ...run, stdout: 'hello\n@@LEARN 1 FAIL\n' })
    expect(wrong.passed).toBe(false)
    expect(wrong.results.map((r) => r.status)).toEqual(['fail', 'fail', 'pass'])
    expect(wrong.results[0]!.detail).toContain('Expected:\nhi')
  })

  it('reports a check the program never reached', () => {
    const l = lesson({ checks: [{ kind: 'test', name: 't', expr: 'x' }] })
    const g = gradeRun(l, '', { stdout: '', stderr: '', error: null, ms: 1 })
    expect(g.results[0]!.detail).toMatch(/never ran/)
  })

  it('does not grade output checks when the code did not run, but still reads the source', () => {
    const l = lesson({
      checks: [
        { kind: 'output', name: 'o', expect: 'hi' },
        { kind: 'source', name: 's', pattern: 'print', absent: false },
      ],
    })
    const g = gradeRun(l, 'print(', { stdout: '', stderr: '', error: 'SyntaxError', ms: 1 })
    expect(g.results[0]!.detail).toMatch(/fix the error/)
    expect(g.results[1]!.status).toBe('pass')
  })

  it('grades SQL on her last result set, in or out of order, and on follow-up queries', () => {
    const l = lesson({
      lang: 'sql',
      checks: [
        { kind: 'result', name: 'r', rows: [[1], [2]], ordered: false },
        { kind: 'query', name: 'q', sql: 'SELECT 1', rows: [[5]] },
      ],
    })
    const program = buildProgram(l, 'SELECT a FROM t')
    expect(program).toContain("SELECT '@@LEARN' AS __learn;")
    expect(program).toContain("SELECT '@@LEARN 1' AS __learn;\nSELECT 1;")
    const tables = [
      { columns: ['a'], rows: [[2], [1]] },
      { columns: ['__learn'], rows: [['@@LEARN']] },
      { columns: ['__learn'], rows: [['@@LEARN 1']] },
      { columns: ['n'], rows: [[5]] },
    ]
    const g = gradeRun(l, 'SELECT a FROM t', { stdout: '', stderr: '', error: null, tables, ms: 1 })
    expect(g.passed).toBe(true)
    expect(g.tables).toHaveLength(1)
  })

  it('treats numbers from SQL within rounding as equal', () => {
    const l = lesson({ lang: 'sql', checks: [{ kind: 'result', name: 'r', rows: [[0.0397]], ordered: true }] })
    const tables = [
      { columns: ['s'], rows: [[0.039700000000000006]] },
      { columns: ['__learn'], rows: [['@@LEARN']] },
    ]
    expect(gradeRun(l, '', { stdout: '', stderr: '', error: null, tables, ms: 1 }).passed).toBe(true)
  })
})
