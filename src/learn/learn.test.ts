import { describe, expect, it } from 'vitest'
import { buildProgram, checkFact, gradeRun, lessonShell, normalize, splitMarks, typeCheckFailures, typeLines } from './grade'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { MASTERY, PREREQUISITES, ROADMAPS, TRACKS as CATALOG_TRACKS, findLesson, nextLesson, streak, trackFor, tracksFor } from './index'
import { MODULE_TRACKS as MODULE_CATALOG } from './modules'
import { MODULE_TRACKS, TRACKS } from './full'
import { trackMeta } from './catalogOf'
import { givesAway } from './giveaway'
import { LEARN_LANGS } from './platform'
import { run as runShell } from '@/lib/shell'
import { LessonFormatError, parseTrack } from './parse'
import { asLesson, gradedUnits } from './practice'
import { courseProblems } from './validate'
import { LEVELS, type LearnLesson } from './types'
import { noteRefs, notePicture, pictureProblem, splitNotes } from '@/lib/contextNotes'

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
  practice: [],
  ...over,
})

/** A language's courses in full (tracksFor gives the catalog's, without the text). */
const coursesIn = (lang: string) => TRACKS.filter((t) => t.lang === lang && !t.subject)

describe('the catalog', () => {
  const withoutFile = ({ file: _file, ...meta }: { file: string }) => meta

  it('holds every course and module file, in the order the app shows them, exactly as parsed but without the text', () => {
    expect(CATALOG_TRACKS.map((t) => t.id)).toEqual(TRACKS.map((t) => t.id))
    expect(CATALOG_TRACKS.map(withoutFile)).toEqual(TRACKS.map((t) => withoutFile(trackMeta(t, ''))))
    expect(MODULE_CATALOG.map((t) => t.id)).toEqual(MODULE_TRACKS.map((t) => t.id))
    expect(MODULE_CATALOG.map(withoutFile)).toEqual(MODULE_TRACKS.map((t) => withoutFile(trackMeta(t, ''))))
  })

  it('carries no course text: only ids, titles and the shape of each lesson', () => {
    const json = JSON.stringify([...CATALOG_TRACKS, ...MODULE_CATALOG])
    for (const key of ['teach', 'task', 'starter', 'solution', 'checks', 'hints', 'ask', 'choices']) expect(json, key).not.toContain(`"${key}":`)
  })

  it('only tests read every course in full: the app loads a course when it is opened', () => {
    const src = path.resolve(__dirname, '..')
    const files = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(path.join(dir, e.name)) : /\.tsx?$/.test(e.name) ? [path.join(dir, e.name)] : []))
    const bad = files(src)
      .filter((f) => !/\.test\.tsx?$/.test(f) && !f.endsWith(path.join('learn', 'full.ts')))
      .filter((f) => /from ['"](?:\.\/|@\/learn\/|\.\.\/learn\/)full['"]|eager:\s*true[^)]*tracks|tracks\/\*\.txt['"][^)]*eager:\s*true/.test(readFileSync(f, 'utf8')))
      .map((f) => path.relative(src, f))
    expect(bad).toEqual([])
  })
})

describe('the tracks', () => {
  it('every language this app teaches has courses that parse, basics first', () => {
    expect([...new Set(TRACKS.map((t) => t.lang))]).toEqual(LEARN_LANGS)
    for (const lang of LEARN_LANGS) expect(tracksFor(lang)[0]!.level, lang).toBe('basics')
    expect(LEARN_LANGS).toEqual(expect.arrayContaining(['bash', 'python', 'sql', 'cpp']))
  })

  it('each track covers the basics: at least ten lessons', () => {
    for (const t of TRACKS) expect(t.lessons.length, t.lang).toBeGreaterThanOrEqual(10)
  })

  it('course ids are unique, and a language\'s courses run in level order', () => {
    const ids = TRACKS.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const lang of LEARN_LANGS) {
      const order = tracksFor(lang).map((t) => LEVELS.indexOf(t.level))
      expect(order, lang).toEqual([...order].sort((a, b) => a - b))
      expect(new Set(order).size, lang).toBe(order.length)
    }
  })

  it('lesson ids are unique across every track', () => {
    const ids = TRACKS.flatMap((t) => t.lessons.map((l) => l.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every lesson teaches, sets a task, has a solution and a hint, and checks something real', () => {
    for (const t of TRACKS) {
      for (const l of t.lessons) {
        if (l.gate) {
          // A gate says what it covers; its problems are graded like lessons but come with no hints.
          expect(l.teach.length, l.id).toBeGreaterThan(40)
          for (const p of l.gate.problems) {
            expect(p.task.length, p.id).toBeGreaterThan(20)
            expect(p.checks.some((c) => c.kind !== 'source'), p.id).toBe(true)
          }
          continue
        }
        expect(l.teach.length, l.id).toBeGreaterThan(80)
        expect(l.task.length, l.id).toBeGreaterThan(20)
        expect(l.solution.trim().length, l.id).toBeGreaterThan(0)
        expect(l.hints.length, l.id).toBeGreaterThan(0)
        // A lesson graded only on its source text would be a string match.
        expect(l.checks.some((c) => c.kind !== 'source'), l.id).toBe(true)
        for (const p of l.practice) {
          expect(p.task.length, p.id).toBeGreaterThan(20)
          expect(p.hints.length, p.id).toBeGreaterThan(0)
          expect(p.checks.some((c) => c.kind !== 'source'), p.id).toBe(true)
        }
      }
    }
  })

  it('C++ lessons with tests do not ask for main — the checker supplies it', () => {
    for (const l of coursesIn('cpp').flatMap((t) => t.lessons)) {
      if (!l.checks.some((c) => c.kind === 'test' || c.kind === 'case')) continue
      expect(/\bint\s+main\s*\(/.test(l.solution), l.id).toBe(false)
    }
  })

  it('SQL lessons all have a database', () => {
    for (const l of coursesIn('sql').flatMap((t) => t.lessons)) expect(l.schema, l.id).toContain('CREATE TABLE')
  })

  it('Web lessons are checked inside the page, never on the source alone', () => {
    for (const l of coursesIn('html').flatMap((t) => t.lessons)) expect(l.checks.some((c) => c.kind === 'dom'), l.id).toBe(true)
  })

  it('every Terminal and Git lesson passes when its solution is typed, and not before', () => {
    // Every graded unit: the lessons, their practice problems and the gates' problems (a gate itself has no checks).
    for (const l of [...coursesIn('bash'), ...coursesIn('git')].flatMap((t) => t.lessons.flatMap(gradedUnits))) {
      const start = lessonShell(l)
      const before = gradeRun(l, '', { stdout: '', stderr: '', error: null, shell: start, ms: 0 })
      expect(before.passed, `${l.id} passes with nothing typed`).toBe(false)
      const after = gradeRun(l, '', { stdout: '', stderr: '', error: null, shell: typeLines(start, l.solution), ms: 0 })
      const failing = after.results.filter((r) => r.status === 'fail').map((r) => `${r.name}: ${r.actual ?? r.detail}`)
      expect(failing, l.id).toEqual([])
    }
  }, 120_000)

  it('every course has a full name for the roadmap, and Git is a course of its own', () => {
    for (const t of TRACKS) expect(t.name.length, t.lang).toBeGreaterThan(t.lang === 'sql' ? 3 : 5)
    expect(trackFor('git')?.lessons.length).toBeGreaterThanOrEqual(10)
  })

  it('every roadmap is made of courses this app has, and every course is on one', () => {
    const ids = new Set(TRACKS.map((t) => t.id))
    const all = [...ROADMAPS, ...MASTERY]
    for (const r of all) for (const step of r.steps) expect(ids.has(step), `${r.id}: ${step}`).toBe(true)
    for (const t of TRACKS) expect(all.some((r) => r.steps.includes(t.id)), t.id).toBe(true)
    expect(new Set(all.map((r) => r.id)).size).toBe(all.length)
  })

  it('a course\'s @requires names real courses that end in a gate, never itself, and every degree course has one', () => {
    const byId = new Map(TRACKS.map((t) => [t.id, t]))
    for (const t of TRACKS) {
      for (const id of t.requires ?? []) {
        expect(byId.has(id), `${t.id} requires ${id}`).toBe(true)
        expect(id, t.id).not.toBe(t.id)
        expect(byId.get(id)!.lessons.some((l) => l.gate), `${t.id} requires ${id}, which has no gate`).toBe(true)
      }
      if (t.subject) expect(t.requires?.length, `${t.id} needs @requires`).toBeGreaterThan(0)
    }
  })

  it('a language with more than one course has a beginner-to-expert roadmap through all of them', () => {
    for (const lang of LEARN_LANGS) {
      const courses = tracksFor(lang)
      if (courses.length < 2) continue
      const steps = MASTERY.find((r) => r.id === `master-${lang}`)?.steps ?? []
      // Its own courses, all of them, in order…
      expect(steps.filter((id) => trackFor(id)?.lang === lang), lang).toEqual(courses.map((t) => t.id))
      // …and another language's course only where the ladder needs it, just before that step.
      const extra = steps.filter((id) => trackFor(id)?.lang !== lang)
      const needed = (PREREQUISITES[lang] ?? []).filter((p) => TRACKS.some((t) => t.id === p.course) && courses.some((t) => t.id === p.before))
      expect(extra, lang).toEqual(needed.map((p) => p.course))
      for (const p of needed) expect(steps.indexOf(p.course) + 1, lang).toBe(steps.indexOf(p.before))
    }
  })

  it('a mastery roadmap brings in the basics its ladder leans on', () => {
    const steps = (lang: string) => MASTERY.find((r) => r.id === `master-${lang}`)?.steps ?? []
    if (steps('typescript').length) expect(steps('typescript').slice(0, 2)).toEqual(['javascript', 'typescript'])
    if (steps('git').length) expect(steps('git').slice(0, 2)).toEqual(['bash', 'git'])
    if (steps('html').includes('html-advanced')) expect(steps('html').slice(0, 4)).toEqual(['html', 'html-intermediate', 'javascript', 'html-advanced'])
  })

  it('continue goes to the first lesson not yet passed', () => {
    const py = TRACKS.find((t) => t.lang === 'python')!
    expect(nextLesson(py, {}).id).toBe('py-01')
    expect(nextLesson(py, { 'py-01': 'x' }).id).toBe('py-02')
    expect(findLesson('py-02')?.index).toBe(1)
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

  it('reads a type-error check (a kind with a hyphen)', () => {
    const t = parseTrack(
      '@track typescript\n@title TypeScript\n\n=== t-1 | One\n--- teach\nx\n--- task\nt\n--- solution\ntype Id = string & { __id: true }\n' +
        "--- check type-error | a plain string is not an Id\nconst id: Id = 'abc'\n?? brand it\n",
    )
    expect(t.lessons[0]!.checks[0]).toEqual({ kind: 'type-error', name: 'a plain string is not an Id', code: "const id: Id = 'abc'", hint: 'brand it' })
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

  it('puts each type-error check behind a @ts-expect-error that fails when the code type-checks', () => {
    const l = lesson({ lang: 'typescript', checks: [{ kind: 'type-error', name: 'n', code: "const id: UserId = 'abc'" }] })
    const p = buildProgram(l, 'type UserId = string & { __brand: "UserId" }\n')
    expect(p).toMatch(/\/\/ @ts-expect-error learn-type-check 0\n\s*;\(\(\) => \{ const id: UserId = 'abc' \}\)/)
  })

  it('reads which type-error checks compiled, and keeps the rest of the program runnable', () => {
    const l = lesson({
      lang: 'typescript',
      checks: [
        { kind: 'type-error', name: 'a', code: 'bad()' },
        { kind: 'type-error', name: 'b', code: 'worse()' },
      ],
    })
    const p = buildProgram(l, 'let x = 1\n')
    const line = p.split('\n').findIndex((s) => s.includes('learn-type-check 1')) + 1
    const err = `Type errors, so nothing ran:\n\nmain.ts(${line},3): error TS2578: Unused '@ts-expect-error' directive.`
    const t = typeCheckFailures(p, err)!
    expect(t.fails).toEqual([1])
    expect(t.program).not.toContain('learn-type-check 1')
    expect(t.program).toContain('learn-type-check 0')
    // Her own type error is hers, not a check's.
    expect(typeCheckFailures(p, 'main.ts(1,5): error TS2322: nope')).toBeNull()
    const g = gradeRun(l, '', { stdout: '', stderr: '', error: null, typeFails: [1], ms: 1 })
    expect(g.results.map((r) => r.status)).toEqual(['pass', 'fail'])
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

/*
 * Every Learn to code lesson carries context notes in its teach section, the
 * same Genius-style notes as the module lessons (src/learn/TEMPLATE.md).
 * These courses were written before that rule and are being rewritten; a
 * course joins the rule when its rewrite lands with `@plainvoice true` in its
 * header, and this list only ever shrinks. A course not on it, every new
 * course included, is held to the rule from the start.
 */
const WRITTEN_BEFORE_NOTES = new Set<string>([

])
const LEARN_NOTES_MIN = 3
const LEARN_NOTES_MAX = 10

describe('degree courses', () => {
  it('every Computer Science course meets every rule in validate.ts', () => {
    expect(TRACKS.filter((t) => t.subject).flatMap(courseProblems)).toEqual([])
  })
})

describe('context notes in Learn to code', () => {
  it('holds every course not written before the rule to it', () => {
    const loose = TRACKS.filter((t) => !t.plainVoice && !WRITTEN_BEFORE_NOTES.has(t.id)).map((t) => t.id)
    expect(loose, 'new courses carry @plainvoice true and notes in every lesson').toEqual([])
  })

  for (const t of TRACKS) {
    it(`${t.id}: notes are complete, at the end of the explanation, and safe`, () => {
      for (const l of t.lessons) {
        const where = `${t.id} ${l.id}`
        for (const p of [...l.practice, ...(l.gate?.problems ?? [])]) expect(noteRefs(p.task), `${p.id}: marks go in the explanation, not a problem`).toEqual([])
        if (l.gate) continue // a gate is an exam, not an explanation: no notes
        const { body, notes } = splitNotes(l.teach)
        const refs = noteRefs(body)
        expect([...new Set(refs)].filter((id) => !notes.has(id)), `${where}: marked phrases with no note`).toEqual([])
        expect([...notes.keys()].filter((id) => !refs.includes(id)), `${where}: notes nothing points to`).toEqual([])
        expect(noteRefs(l.task), `${where}: marks go in the explanation, not the task`).toEqual([])
        if (notes.size) {
          const first = l.teach.search(/^\s*:::\s*context\s/m)
          const after = l.teach.slice(first).replace(/^[ \t]*:::[ \t]*context[\s\S]*?^[ \t]*:::[ \t]*$/gm, '').trim()
          expect(after, `${where}: notes go at the very end of the explanation`).toBe('')
        }
        for (const n of notes.values()) {
          const words = n.body.replace(/```[\s\S]*?```/g, ' ').split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length
          expect(words, `${where}: note "${n.id}" 15–260 words`).toBeGreaterThanOrEqual(15)
          expect(words, `${where}: note "${n.id}" 15–260 words`).toBeLessThanOrEqual(260)
          const svg = notePicture(n.body)
          if (svg) expect(pictureProblem(svg), `${where}: note "${n.id}" picture`).toBeNull()
        }
        if (t.plainVoice) {
          expect(notes.size, `${where}: ${LEARN_NOTES_MIN}–${LEARN_NOTES_MAX} context notes`).toBeGreaterThanOrEqual(LEARN_NOTES_MIN)
          expect(notes.size, `${where}: ${LEARN_NOTES_MIN}–${LEARN_NOTES_MAX} context notes`).toBeLessThanOrEqual(LEARN_NOTES_MAX)
        }
        for (const part of [l.teach, l.task, ...l.hints]) {
          expect(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(part), `${where}: a control character (a TeX or escape lost its backslash)`).toBe(false)
        }
      }
    })
  }
})

/**
 * Lessons whose examples still give the answer away (see giveaway.ts). This
 * list only shrinks: rewrite the example on different names and data, or show
 * the pieces instead of the finished answer, then take the id out.
 */
const GIVES_AWAY = new Set<string>([])

describe('examples leave the task to her', () => {
  const lessons = TRACKS.flatMap((t) => t.lessons)
  it('no example shows the answer word for word, or as a template to fill in', () => {
    for (const l of lessons) if (!GIVES_AWAY.has(l.id) && !l.gate) expect(givesAway(l), `${l.id}: the example gives the answer away`).toBeNull()
  })
  it('no practice problem can be copied from the lesson\'s examples either', () => {
    for (const l of lessons) for (const p of l.practice) expect(givesAway(asLesson(l, p)), `${p.id}: the lesson's example gives this practice problem away`).toBeNull()
  })
  it('the list of lessons still to fix has no stale entries', () => {
    const ids = new Set(lessons.map((l) => l.id))
    for (const id of GIVES_AWAY) {
      expect(ids.has(id), `${id} is not a lesson`).toBe(true)
      expect(givesAway(lessons.find((l) => l.id === id)!), `${id} is fixed: take it out of GIVES_AWAY`).not.toBeNull()
    }
  })
})
