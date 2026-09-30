import { afterAll, describe, expect, it } from 'vitest'
import { TRACKS } from './full'
import { buildProgram, gradeRun } from './grade'
import { cleanUp, run } from './runLocal'
import { tutorLine, type TutorInput, type TutorMemory, type TutorRun } from './tutor'
import type { LearnCheck, LearnLang, LearnLesson } from './types'

afterAll(cleanUp)

const fail = (name: string, view: Record<string, string> = {}) => ({ name, status: 'fail' as const, ...view })
const pass = (name: string) => ({ name, status: 'pass' as const })
const runOf = (over: Partial<TutorRun>): TutorRun => ({ results: [], output: '', stderr: '', error: null, ...over })

function input(over: Partial<TutorInput> & { run: TutorRun }): TutorInput {
  return {
    lang: 'python' as LearnLang,
    task: 'Print a greeting.',
    hints: ['Use `print("...")` with the text inside quotes.', 'The text is exactly `Hello, world!`.'],
    solution: 'print("Hello, world!")',
    starter: '# write your code here',
    code: 'print("hello, world")',
    attempt: 1,
    said: [],
    ...over,
  }
}

describe('the tutor says something about this run', () => {
  it('says nothing when the run passed', () => {
    expect(tutorLine(input({ run: runOf({ results: [pass('prints the greeting')] }) }))).toBeNull()
  })

  it('points at the capital letters, then says what they should be', () => {
    const checks: LearnCheck[] = [{ kind: 'output', name: 'prints the greeting', expect: 'Hello, world!' }]
    const r = runOf({ results: [fail('prints the greeting', { expected: 'Hello, world!', actual: 'hello, world!' })], output: 'hello, world!' })
    const first = tutorLine(input({ run: r, checks, code: 'print("hello, world!")' }))!
    expect(first.text).toMatch(/capital letters/)
    expect(first.text).not.toMatch(/Hello, world!/)
    const second = tutorLine(input({ run: r, checks, code: 'print("hello, world!") ', attempt: 2, said: [first.text], before: first.memory }))!
    expect(second.text).toMatch(/“Hello, world!”/)
    expect(second.text).not.toBe(first.text)
  })

  it('notices nothing was printed', () => {
    const checks: LearnCheck[] = [{ kind: 'output', name: 'prints', expect: '42' }]
    const r = runOf({ results: [fail('prints', { expected: '42', actual: '(nothing printed)' })] })
    expect(tutorLine(input({ run: r, checks, code: 'x = 42' }))!.text).toMatch(/[Nn]othing was printed/)
  })

  it('notices an answer that is off by one', () => {
    const checks: LearnCheck[] = [{ kind: 'output', name: 'the total', expect: '15' }]
    const r = runOf({ results: [fail('the total', { expected: '15', actual: '14' })], output: '14' })
    expect(tutorLine(input({ run: r, checks, code: 'print(sum(range(5)))' }))!.text).toMatch(/off by one/)
  })

  it('tells printing from returning', () => {
    const checks: LearnCheck[] = [{ kind: 'case', name: 'add(2, 3)', call: 'add(2, 3)', expect: '5' }]
    const r = runOf({ results: [fail('add(2, 3)', { input: 'add(2, 3)', expected: '5', actual: 'None' })], output: '5' })
    const t = tutorLine(input({ run: r, checks, code: 'def add(a, b):\n    print(a + b)', solution: 'def add(a, b):\n    return a + b' }))!
    expect(t.text).toMatch(/prints the answer, but it doesn't give it back/)
    expect(t.text).toMatch(/`add\(2, 3\)`/)
  })

  it('finds the misspelt name and suggests the right one, on her line', () => {
    const r = runOf({ error: "NameError: name 'totl' is not defined", stderr: 'Traceback (most recent call last):\n  File "main.py", line 3, in <module>\nNameError: name \'totl\' is not defined' })
    const t = tutorLine(input({ run: r, code: 'total = 0\ntotal += 5\nprint(totl)' }))!
    expect(t.text).toMatch(/`totl` on line 3\. Did you mean `total`\?/)
  })

  it('reads a missing colon, and maps the line back past any checker lines before hers', () => {
    const code = 'x = 3\nif x > 2\n    print("big")'
    const r = runOf({ error: "SyntaxError: expected ':'", stderr: `  File "main.py", line 12\n    if x > 2\n            ^\nSyntaxError: expected ':'` })
    const t = tutorLine(input({ run: r, code, program: `${'# checker\n'.repeat(10)}${code}` }))!
    expect(t.text).toMatch(/[Ll]ine 2 is missing the colon/)
  })

  it('explains adding text to a number', () => {
    const r = runOf({ error: 'TypeError: can only concatenate str (not "int") to str', stderr: 'File "main.py", line 2\nTypeError: can only concatenate str (not "int") to str' })
    expect(tutorLine(input({ run: r, code: 'age = 12\nprint("I am " + age)' }))!.text).toMatch(/adding text and a number/)
  })

  it('reads C++, SQL and JavaScript errors too', () => {
    const cpp = tutorLine(input({ lang: 'cpp', code: 'int main() {\n  int x = 1\n  return x;\n}', run: runOf({ error: 'compile error', stderr: "main.cpp:3:3: error: expected ';' after expression" }) }))!
    expect(cpp.text).toMatch(/semicolon is missing at the end of line/)
    const sql = tutorLine(input({ lang: 'sql', code: 'SELECT nme FROM people;', solution: 'SELECT name FROM people;', run: runOf({ error: 'no such column: nme' }) }))!
    expect(sql.text).toMatch(/no column called `nme`\. Did you mean `name`\?/)
    const js = tutorLine(input({ lang: 'javascript', code: 'const total = 1\nconsole.log(totl)', run: runOf({ error: 'ReferenceError: totl is not defined' }) }))!
    expect(js.text).toMatch(/Did you mean `total`\?/)
  })

  it('says when the code has not changed, and when the same code runs again', () => {
    const r = runOf({ results: [fail('prints')] })
    expect(tutorLine(input({ run: r, code: '# write your code here' }))!.text).toMatch(/hasn't changed/)
    const first = tutorLine(input({ run: r }))!
    const again = tutorLine(input({ run: r, attempt: 2, said: [first.text], before: first.memory }))!
    expect(again.text).toMatch(/same code as last time/)
  })

  it('notices progress: the error gone, or more checks passing', () => {
    const errored = tutorLine(input({ run: runOf({ error: "NameError: name 'x' is not defined" }), code: 'print(x)' }))!
    const checks: LearnCheck[] = [{ kind: 'output', name: 'prints', expect: '3' }]
    const now = tutorLine(input({ run: runOf({ results: [fail('prints', { expected: '3', actual: '2' })], output: '2' }), checks, code: 'x = 2\nprint(x)', attempt: 2, said: [errored.text], before: errored.memory }))!
    expect(now.text).toMatch(/error's gone|runs now|no more error/)
    const two = runOf({ results: [pass('a'), fail('b'), fail('c')] })
    const three = runOf({ results: [pass('a'), pass('b'), fail('c')] })
    const a = tutorLine(input({ run: two }))!
    expect(tutorLine(input({ run: three, code: 'print(1)', attempt: 2, said: [a.text], before: a.memory }))!.text).toMatch(/2 of 3 checks pass now/)
  })

  it('brings in the lesson hints, then the solution, as the tries go on', () => {
    const r = runOf({ results: [fail('prints')] })
    const said: string[] = []
    let before: TutorMemory | null = null
    const lines: string[] = []
    for (let attempt = 1; attempt <= 6; attempt++) {
      const t: { text: string; memory: TutorMemory } = tutorLine(input({ run: r, code: `print("hi") # ${attempt}`, attempt, said, before }))!
      lines.push(t.text)
      said.push(t.text)
      before = t.memory
    }
    expect(lines[2]).toMatch(/Here's a hint: Use `print\("..."\)`/)
    expect(lines[3]).toMatch(/Here's a hint: The text is exactly/)
    expect(lines[4]).toMatch(/open the solution/)
    expect(lines.slice(1).every((l, i) => l !== lines[i])).toBe(true)
  })

  it('uses her name now and then', () => {
    const t = tutorLine(input({ run: runOf({ results: [fail('prints')] }), name: 'Ava' }))!
    expect(t.text).toMatch(/Ava/)
  })
})

/* ── On real lessons, run for real ───────────────────────────────────────── */

describe('the tutor on real runs of real lessons', () => {
  const lessonOf = (lang: string, has: RegExp) =>
    TRACKS.filter((t) => t.lang === lang).flatMap((t) => t.lessons).find((l) => !l.gate && has.test(l.solution)) as LearnLesson
  async function said(lesson: LearnLesson, code: string, attempt = 1) {
    const g = gradeRun(lesson, code, await run(lesson, code))
    expect(g.passed).toBe(false)
    return tutorLine({ lang: lesson.lang, task: lesson.task, hints: lesson.hints, solution: lesson.solution, starter: lesson.starter, code, program: buildProgram(lesson, code), run: g, checks: lesson.checks, attempt, said: [] })!.text
  }

  it('Python: a missing colon, on the line it is missing from', async () => {
    const lesson = lessonOf('python', /^\s*(if|for|def)\b.*:\s*$/m)
    const m = lesson.solution.match(/^(\s*(?:if|for|def)\b[^\n]*):\s*$/m)!
    const line = lesson.solution.slice(0, m.index).split('\n').length
    expect(await said(lesson, lesson.solution.replace(m[0], m[1]!))).toMatch(new RegExp(`[Ll]ine ${line} is missing the colon`))
  }, 60_000)

  it('Python: a function that prints instead of returning', async () => {
    const lesson = TRACKS.filter((t) => t.lang === 'python').flatMap((t) => t.lessons).find((l) => !l.gate && l.checks.some((c) => c.kind === 'case') && /^\s{4}return [a-z_]+\s*$/m.test(l.solution)) as LearnLesson
    const code = lesson.solution.replace(/^(\s{4})return ([a-z_]+)\s*$/m, '$1print($2)')
    expect(await said(lesson, code)).toMatch(/give(?:s)? (?:it )?(?:anything )?back|doesn't give/)
  }, 60_000)

  it('SQL: a misspelt column, with the right name suggested', async () => {
    const lesson = lessonOf('sql', /SELECT\s+[a-z_]{4,}/i)
    const col = lesson.solution.match(/SELECT\s+([a-z_]{4,})/i)![1]!
    expect(await said(lesson, lesson.solution.replace(col, col.slice(0, -1)))).toContain(`Did you mean \`${col}\`?`)
  }, 60_000)

  it('C++: a missing semicolon, with its line', async () => {
    const lesson = lessonOf('cpp', /^\s*int \w+ = [^;\n]+;\s*$/m)
    const m = lesson.solution.match(/^(\s*int \w+ = [^;\n]+);\s*$/m)!
    expect(await said(lesson, lesson.solution.replace(m[0], m[1]!))).toMatch(/semicolon is missing/)
  }, 60_000)
})
