/* Every graded problem in every course, run for real: the reference solution must pass every check, and
   the starter must not (the problem asks for work). Lessons, practice problems and gate problems alike.

   Python runs on CPython, C++ on clang with the in-browser compiler's flags, SQL on SQLite through
   Python's sqlite3 module, which returns result sets the way sql.js does. The Terminal and Git courses run
   on the practice shell itself. A problem that passes here passes in the app. */
import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { cpus, tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { buildProgram, gradeRun, lessonShell, typeLines } from './grade'
import { TRACKS } from './index'
import { gradedUnits } from './practice'
import type { LearnLesson, LearnRun } from './types'

const dir = mkdtempSync(join(tmpdir(), 'orbit-solutions-'))
afterAll(() => rmSync(dir, { recursive: true, force: true }))

function exec(cmd: string, args: string[], stdin: string, ms: number): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    const timer = setTimeout(() => p.kill('SIGKILL'), ms)
    p.stdout.on('data', (d) => (stdout += d))
    p.stderr.on('data', (d) => (stderr += d))
    p.on('close', (code) => {
      clearTimeout(timer)
      resolve({ code, stdout, stderr })
    })
    p.stdin.on('error', () => {}) // a program that exits without reading its input
    p.stdin.end(stdin)
  })
}

const SQL_RUNNER = String.raw`
import json, sqlite3, sys
schema, program = json.load(sys.stdin)
db = sqlite3.connect(':memory:', isolation_level=None)
tables, error = [], None
def run(script):
    buf = ''
    for ch in script:
        buf += ch
        if ch == ';' and sqlite3.complete_statement(buf):
            one(buf); buf = ''
    if buf.strip() and sqlite3.complete_statement(buf + ';'):
        one(buf)
def one(stmt):
    lines = [l for l in stmt.split('\n') if not l.strip().startswith('--')]
    if not ''.join(lines).strip().rstrip(';').strip():
        return
    cur = db.execute(stmt)
    if cur.description:
        rows = cur.fetchall()
        if rows:  # sql.js leaves out a statement that returned no rows
            tables.append({'columns': [d[0] for d in cur.description], 'rows': [list(r) for r in rows]})
try:
    if schema:
        db.executescript(schema)
    run(program)
except Exception as e:
    tables, error = [], str(e)
print(json.dumps({'tables': tables, 'error': error}))
`

const SQL_FILE = join(dir, 'sql.py')
writeFileSync(SQL_FILE, SQL_RUNNER)

// Pyodide runs a program with top-level await (an asyncio lesson awaits at the top); CPython needs asking.
const PY_FILE = join(dir, 'py.py')
writeFileSync(
  PY_FILE,
  String.raw`
import ast, asyncio, sys
path = sys.argv[1]
sys.argv = ['main.py']
code = compile(open(path).read(), 'main.py', 'exec', flags=ast.PyCF_ALLOW_TOP_LEVEL_AWAIT)
result = eval(code, {'__name__': '__main__'})
if asyncio.iscoroutine(result):
    asyncio.run(result)
`,
)

let n = 0
async function run(lesson: LearnLesson, code: string): Promise<LearnRun> {
  const program = buildProgram(lesson, code)
  const id = `${n++}`
  if (lesson.lang === 'python') {
    const file = join(dir, `p${id}.py`)
    writeFileSync(file, program)
    const r = await exec('python3', ['-I', PY_FILE, file], lesson.stdin ?? '', 30_000)
    return { stdout: r.stdout, stderr: r.stderr, error: r.code === 0 ? null : r.stderr.trim().split('\n').pop() || `exit ${r.code}`, ms: 0 }
  }
  if (lesson.lang === 'cpp') {
    const src = join(dir, `c${id}.cpp`)
    const bin = join(dir, `c${id}`)
    writeFileSync(src, program)
    const built = await exec('clang++', ['-std=c++20', '-O1', '-w', '-fno-exceptions', src, '-o', bin], '', 120_000)
    if (built.code !== 0) return { stdout: '', stderr: built.stderr, error: built.stderr || 'did not compile', ms: 0 }
    const r = await exec(bin, [], lesson.stdin ?? '', 20_000)
    return { stdout: r.stdout, stderr: r.stderr, error: r.code === 0 ? null : `exit ${r.code}`, ms: 0 }
  }
  if (lesson.lang === 'sql') {
    const r = await exec('python3', ['-I', SQL_FILE], JSON.stringify([lesson.schema ?? '', program]), 30_000)
    const out = JSON.parse(r.stdout || '{"tables":[],"error":"runner failed"}') as { tables: LearnRun['tables']; error: string | null }
    return { stdout: '', stderr: r.stderr, error: out.error, tables: out.tables, ms: 0 }
  }
  if (lesson.lang === 'bash' || lesson.lang === 'git') {
    // Nothing is typed until she types it: a terminal problem's "starter" is the empty prompt.
    const start = lessonShell(lesson)
    return { stdout: '', stderr: '', error: null, shell: code === lesson.solution ? typeLines(start, code) : start, ms: 0 }
  }
  throw new Error(`no runner for ${lesson.lang}`)
}

/** Runs tasks a few at a time: compiling hundreds of C++ programs one by one takes too long. */
async function pool<T, R>(items: T[], width: number, f: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let next = 0
  await Promise.all(
    Array.from({ length: width }, async () => {
      while (next < items.length) {
        const i = next++
        out[i] = await f(items[i]!)
      }
    }),
  )
  return out
}

const RUNNABLE = new Set(['python', 'cpp', 'sql', 'bash', 'git'])

describe('every problem can be solved, and needs solving', () => {
  // LEARN_ONLY=python-intermediate,sql checks just those courses: what a writer runs while working on one.
  const only = process.env.LEARN_ONLY?.split(',').map((s) => s.trim()).filter(Boolean)
  const units = TRACKS.filter((t) => RUNNABLE.has(t.lang) && (!only || only.includes(t.id))).flatMap((t) => t.lessons.flatMap(gradedUnits))

  it(`the reference solution passes every check and the starter does not (${units.length} problems)`, async () => {
    const problems = await pool(units, Math.max(2, cpus().length), async (u) => {
      const solved = gradeRun(u, u.solution, await run(u, u.solution))
      const failing = solved.results.filter((r) => r.status === 'fail').map((r) => `${r.name}: ${r.detail ?? r.actual ?? ''}`.slice(0, 200))
      const out: string[] = []
      if (failing.length) out.push(`${u.id}: the solution fails ${failing.join(' | ')}${solved.error ? ` (error: ${solved.error.slice(0, 200)})` : ''}`)
      const started = gradeRun(u, u.starter, await run(u, u.starter))
      if (started.passed) out.push(`${u.id}: the starter already passes`)
      return out
    })
    expect(problems.flat()).toEqual([])
  }, 3_600_000)
})
