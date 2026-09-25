import { describe, expect, it } from 'vitest'
import { buildProgram, checkFact, gradeRun, lessonShell, normalize, splitMarks, typeLines } from './grade'
import { ROADMAPS, TRACKS, findLesson, nextLesson, streak, trackFor } from './index'
import { LEARN_LANGS } from './platform'
import { run as runShell } from '@/lib/shell'
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
    expect(LEARN_LANGS).toEqual(expect.arrayContaining(['bash', 'python', 'sql', 'cpp']))
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
      if (!l.checks.some((c) => c.kind === 'test' || c.kind === 'case')) continue
      expect(/\bint\s+main\s*\(/.test(l.solution), l.id).toBe(false)
    }
  })

  it('SQL lessons all have a database', () => {
    for (const l of TRACKS.find((t) => t.lang === 'sql')?.lessons ?? []) expect(l.schema, l.id).toContain('CREATE TABLE')
  })

  it('Web lessons are checked inside the page, never on the source alone', () => {
    for (const l of trackFor('html')?.lessons ?? []) expect(l.checks.some((c) => c.kind === 'dom'), l.id).toBe(true)
  })

  it('every Terminal and Git lesson passes when its solution is typed, and not before', () => {
    for (const l of [...trackFor('bash')!.lessons, ...(trackFor('git')?.lessons ?? [])]) {
      const start = lessonShell(l)
      const before = gradeRun(l, '', { stdout: '', stderr: '', error: null, shell: start, ms: 0 })
      expect(before.passed, `${l.id} passes with nothing typed`).toBe(false)
      const after = gradeRun(l, '', { stdout: '', stderr: '', error: null, shell: typeLines(start, l.solution), ms: 0 })
      const failing = after.results.filter((r) => r.status === 'fail').map((r) => `${r.name}: ${r.actual ?? r.detail}`)
      expect(failing, l.id).toEqual([])
    }
  })

  it('every course has a full name for the roadmap, and Git is a course of its own', () => {
    for (const t of TRACKS) expect(t.name.length, t.lang).toBeGreaterThan(t.lang === 'sql' ? 3 : 5)
    expect(trackFor('git')?.lessons.length).toBeGreaterThanOrEqual(10)
  })

  it('every roadmap is made of courses this app has, and every course is on one', () => {
    const langs = new Set(TRACKS.map((t) => t.lang))
    for (const r of ROADMAPS) for (const step of r.steps) expect(langs.has(step), `${r.id}: ${step}`).toBe(true)
    for (const t of TRACKS) expect(ROADMAPS.some((r) => r.steps.includes(t.lang)), t.lang).toBe(true)
    expect(new Set(ROADMAPS.map((r) => r.id)).size).toBe(ROADMAPS.length)
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

  it('reads test cases, page checks and terminal checks', () => {
    const t = parseTrack(
      head +
        '=== p-1 | One\n--- teach\nx\n--- task\nt\n--- solution\ny\n' +
        '--- check case | adds\nadd(2,\n  3)\n=> 5\n--- check dom | heading\nclick button\nh1 text == Hi\n--- check shell | made it\ndir notes\ncwd notes\n',
    )
    const [c, d, sh] = t.lessons[0]!.checks
    expect(c).toEqual({ kind: 'case', name: 'adds', call: 'add(2, 3)', expect: '5' })
    expect(d).toEqual({ kind: 'dom', name: 'heading', steps: ['click button', 'h1 text == Hi'] })
    expect(sh).toEqual({ kind: 'shell', name: 'made it', facts: ['dir notes', 'cwd notes'] })
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
    expect(p).toMatch(/int main\(\) \{\n\s+\{ bool __r = \(f\(\) == 2\);/)
  })

  it('runs a test case as a call compared with the expected value, in each language', () => {
    const c = { kind: 'case' as const, name: 'n', call: 'add(2, 3)', expect: '5' }
    expect(buildProgram(lesson({ checks: [c] }), '')).toContain('__case(0, () => (add(2, 3)), () => (5))')
    expect(buildProgram(lesson({ lang: 'python', checks: [c] }), '')).toContain('__learn_case(0, lambda: (add(2, 3)), lambda: (5))')
    expect(buildProgram(lesson({ lang: 'cpp', checks: [c] }), '')).toContain('auto __v = (add(2, 3)); bool __ok = (__v == (5));')
  })

  it('shows a test case the way a judge does: input, expected, and what she got', () => {
    const l = lesson({ checks: [{ kind: 'case', name: 'adds', call: 'add(2, 3)', expect: '5' }] })
    const g = gradeRun(l, '', { stdout: '@@LEARN 0 FAIL 6\n', stderr: '', error: null, ms: 1 })
    expect(g.results[0]).toMatchObject({ status: 'fail', input: 'add(2, 3)', expected: '5', actual: '6' })
  })

  it('grades a page check from what the page reported', () => {
    const l = lesson({ lang: 'html', checks: [{ kind: 'dom', name: 'h', steps: ['h1 exists'] }] })
    const run = { stdout: '', stderr: '', error: null, ms: 1 }
    expect(gradeRun(l, '', { ...run, dom: [{ pass: true }] }).passed).toBe(true)
    const g = gradeRun(l, '', { ...run, dom: [{ pass: false, detail: 'there is no h1 on the page' }] })
    expect(g.results[0]).toMatchObject({ status: 'fail', actual: 'there is no h1 on the page' })
    expect(gradeRun(l, '', { ...run, dom: null }).results[0]!.detail).toMatch(/did not finish loading/)
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
    expect(wrong.results[0]).toMatchObject({ expected: 'hi', actual: 'hello' })
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

describe('terminal facts', () => {
  const typed = (...lines: string[]) => typeLines(lessonShell(lesson({ lang: 'bash' })), lines.join('\n'))

  it('reads where she is, what exists and what files hold', () => {
    const s = typed('mkdir -p a/b', 'echo "hi there" > a/note.txt', 'cd a/b')
    expect(checkFact(s, 'cwd a/b')).toBeNull()
    expect(checkFact(s, 'cwd .')).toMatch(/you are in ~\/project\/a\/b/)
    expect(checkFact(s, 'dir a')).toBeNull()
    expect(checkFact(s, 'file a/note.txt == hi there')).toBeNull()
    expect(checkFact(s, 'file a/note.txt contains there')).toBeNull()
    expect(checkFact(s, 'file a/note.txt == hi')).toMatch(/contains "hi there"/)
    expect(checkFact(s, 'missing a')).toMatch(/should not exist/)
  })

  it('reads what she ran and used, and what it printed', () => {
    const s = typed('pwd', 'mkdir x && cd x')
    expect(checkFact(s, 'ran pwd')).toBeNull()
    expect(checkFact(s, 'ran ls')).toMatch(/not run ls/)
    expect(checkFact(s, 'ran cd x')).toBeNull()
    expect(checkFact(s, 'used &&')).toBeNull()
    expect(checkFact(s, 'printed /home/you/project')).toBeNull()
  })

  it('reads git: the repo, its commits, branch and what is staged', () => {
    let s = typed('git init', 'touch a.txt', 'git add .')
    expect(checkFact(s, 'git . repo')).toBeNull()
    expect(checkFact(s, 'git . staged a.txt')).toBeNull()
    expect(checkFact(s, 'git . clean')).toMatch(/still staged/)
    s = runShell(s, 'git commit -m "first"').state
    expect(checkFact(s, 'git . commits == 1')).toBeNull()
    expect(checkFact(s, 'git . clean')).toBeNull()
    s = runShell(s, 'git checkout -b feature').state
    expect(checkFact(s, 'git . branch feature')).toBeNull()
    expect(checkFact(s, 'git . has-branch main')).toBeNull()
    expect(checkFact(s, 'git . commits-on main == 1')).toBeNull()
    s = runShell(s, 'git switch main').state
    expect(checkFact(s, 'git . merges == 0')).toBeNull()
    expect(checkFact(s, 'git . log contains first')).toBeNull()
    expect(checkFact(s, 'git . log contains nope')).toMatch(/no commit message/)
  })

  it('reads a printed line exactly, not as part of a longer one', () => {
    const s = typed('pwd')
    expect(checkFact(s, 'printed-line /home/you/project')).toBeNull()
    expect(checkFact(s, 'printed-line /home/you')).toMatch(/nothing has printed/)
  })

  it('forgets the setup, so only what she typed counts', () => {
    const l = lesson({ lang: 'bash', starter: 'mkdir src\ntouch README.md\n' })
    const s = lessonShell(l)
    expect(s.history).toEqual([])
    expect(checkFact(s, 'dir src')).toBeNull()
    expect(checkFact(s, 'ran mkdir')).not.toBeNull()
  })
})

describe('the streak', () => {
  const at = (d: string) => new Date(`${d}T12:00:00`).toISOString()
  const now = new Date('2026-05-10T18:00:00')

  it('counts days in a row with a pass, ending today', () => {
    expect(streak({ a: at('2026-05-10'), b: at('2026-05-09'), c: at('2026-05-08'), d: at('2026-05-05') }, now)).toBe(3)
  })

  it('is not broken yet by a day that has not had its pass', () => {
    expect(streak({ a: at('2026-05-09'), b: at('2026-05-08') }, now)).toBe(2)
  })

  it('is zero after a missed day', () => {
    expect(streak({ a: at('2026-05-07') }, now)).toBe(0)
    expect(streak({}, now)).toBe(0)
  })
})
