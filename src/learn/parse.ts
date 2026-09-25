/* ============================================================================
   Learn mode — the lesson file format
   ----------------------------------------------------------------------------
   One file per language. Plain text, so code is written exactly as it runs:

     @track python
     @title Python
     @blurb One line on what this track covers.
     @schema
     SQL every lesson starts from, unless it has its own --- schema
     @end

     === py-01 | Printing
     --- teach
     Markdown explaining the idea.
     --- task
     Markdown: the one thing to do.
     --- starter
     code the editor opens with
     --- solution
     code that passes every check
     --- hint
     One hint. Repeat the section for more; they are revealed in order.
     --- stdin
     input the program reads (optional)
     --- schema
     SQL that builds the lesson's tables (SQL only)
     --- check output | Prints the greeting
     Hello, world!
     --- check includes | Mentions both totals
     total: 3
     total: 7
     --- check test | add(2, 3) gives 5
     add(2, 3) == 5
     --- check case | add(2, 3)
     add(2, 3)
     => 5
     --- check dom | The heading says Hello          (Web)
     h1 text == Hello
     --- check shell | notes/ exists and you are in it (Terminal)
     dir notes
     cwd notes
     --- check source | Uses a for loop
     \bfor\b
     --- check source absent | Does not hard-code the answer
     print\(\s*120\s*\)
     --- check result | Returns the three names, in order
     ordered
     [["ada"], ["lin"], ["sam"]]
     --- check query | The row is really gone
     SELECT COUNT(*) FROM users WHERE id = 3
     => [[0]]

   Inside a check, a line starting `?? ` is that check's hint. Only `=== ` and
   the known `--- ` headers above are structure; anything else is content, so
   a SQL comment or a markdown rule never breaks a lesson.
   ========================================================================== */
import type { Cell, LearnCheck, LearnLang, LearnLesson, LearnTrack } from './types'

const LANGS: readonly LearnLang[] = ['javascript', 'typescript', 'python', 'sql', 'cpp', 'html', 'bash']
const SECTIONS = new Set(['teach', 'task', 'starter', 'solution', 'hint', 'stdin', 'schema', 'check'])

export class LessonFormatError extends Error {}

function fail(where: string, message: string): never {
  throw new LessonFormatError(`${where}: ${message}`)
}

/** Drops leading and trailing blank lines, keeps everything in between. */
function trimBlock(lines: string[]): string {
  let a = 0
  let b = lines.length
  while (a < b && lines[a]!.trim() === '') a++
  while (b > a && lines[b - 1]!.trim() === '') b--
  return lines.slice(a, b).join('\n')
}

/** Code keeps exactly one trailing newline, the way an editor saves it. */
function code(lines: string[]): string {
  const t = trimBlock(lines)
  return t ? `${t}\n` : ''
}

function rows(text: string, where: string): Cell[][] {
  let v: unknown
  try {
    v = JSON.parse(text)
  } catch {
    return fail(where, `expected rows as JSON, got: ${text.slice(0, 60)}`)
  }
  const ok =
    Array.isArray(v) &&
    v.every((r) => Array.isArray(r) && r.every((c) => c === null || typeof c === 'string' || typeof c === 'number'))
  if (!ok) fail(where, 'rows must be an array of arrays of strings, numbers or null')
  return v as Cell[][]
}

function parseCheck(header: string, body: string[], where: string): LearnCheck {
  const m = /^check\s+(\w+)(?:\s+(\w+))?\s*\|\s*(.+)$/.exec(header)
  if (!m) fail(where, `a check needs "--- check <kind> | <name>", got "--- ${header}"`)
  const [, kind, flag, name] = m
  const hint = body.filter((l) => l.startsWith('?? ')).map((l) => l.slice(3).trim()).join(' ') || undefined
  const lines = body.filter((l) => !l.startsWith('?? '))
  const text = trimBlock(lines)
  const base = { name: name!.trim(), ...(hint ? { hint } : {}) }
  const at = `${where} "${base.name}"`

  switch (kind) {
    case 'output':
      if (!text) fail(at, 'an output check needs the expected output')
      return { ...base, kind: 'output', expect: text }
    case 'includes': {
      const expect = trimBlock(lines).split('\n').filter((l) => l.trim() !== '')
      if (!expect.length) fail(at, 'an includes check needs at least one line')
      return { ...base, kind: 'includes', expect }
    }
    case 'test':
      if (!text) fail(at, 'a test check needs an expression')
      return { ...base, kind: 'test', expr: text }
    case 'case': {
      const i = lines.findIndex((l) => l.startsWith('=> '))
      if (i < 0) fail(at, 'a case needs the call, then a "=> expected" line')
      const call = trimBlock(lines.slice(0, i)).replace(/\s*\n\s*/g, ' ')
      const expect = lines.slice(i).join('\n').slice(3).trim()
      if (!call || !expect) fail(at, 'a case needs both a call and an expected value')
      return { ...base, kind: 'case', call, expect }
    }
    case 'dom':
    case 'shell': {
      const steps = trimBlock(lines).split('\n').map((l) => l.trim()).filter(Boolean)
      if (!steps.length) fail(at, `a ${kind} check needs at least one line`)
      return kind === 'dom' ? { ...base, kind: 'dom', steps } : { ...base, kind: 'shell', facts: steps }
    }
    case 'source': {
      if (flag && flag !== 'absent') fail(at, `unknown source flag "${flag}"`)
      if (!text) fail(at, 'a source check needs a pattern')
      try {
        new RegExp(text)
      } catch {
        fail(at, `not a valid pattern: ${text}`)
      }
      return { ...base, kind: 'source', pattern: text, absent: flag === 'absent' }
    }
    case 'result': {
      const ls = trimBlock(lines).split('\n')
      const ordered = ls[0]?.trim() === 'ordered'
      const json = (ordered ? ls.slice(1) : ls).join('\n').trim()
      return { ...base, kind: 'result', rows: rows(json, at), ordered }
    }
    case 'query': {
      const i = lines.findIndex((l) => l.startsWith('=> '))
      if (i < 0) fail(at, 'a query check needs a "=> [[...]]" line with the expected rows')
      const sql = trimBlock(lines.slice(0, i))
      if (!sql) fail(at, 'a query check needs a query')
      return { ...base, kind: 'query', sql, rows: rows(lines.slice(i).join('\n').slice(3).trim(), at) }
    }
    default:
      return fail(at, `unknown check kind "${kind}"`)
  }
}

/** Parses one track file. Throws LessonFormatError naming the lesson at fault. */
export function parseTrack(source: string, file = 'track'): LearnTrack {
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  const meta: Record<string, string> = {}
  const lessons: LearnLesson[] = []

  let i = 0
  let trackSchema: string | undefined
  for (; i < lines.length && !lines[i]!.startsWith('=== '); i++) {
    if (lines[i]!.trim() === '@schema') {
      const start = ++i
      while (i < lines.length && lines[i]!.trim() !== '@end') i++
      if (i >= lines.length) fail(file, '"@schema" without a closing "@end"')
      trackSchema = trimBlock(lines.slice(start, i))
      continue
    }
    const m = /^@(\w+)\s+(.*)$/.exec(lines[i]!)
    if (m) meta[m[1]!] = m[2]!.trim()
  }
  const lang = meta.track as LearnLang
  if (!LANGS.includes(lang)) fail(file, `"@track" must be one of ${LANGS.join(', ')}`)
  if (!meta.title) fail(file, 'missing "@title"')

  while (i < lines.length) {
    const head = /^=== (\S+)\s*\|\s*(.+)$/.exec(lines[i]!)
    if (!head) fail(file, `expected "=== <id> | <title>" at line ${i + 1}`)
    const id = head[1]!
    const where = `${file} ${id}`
    i++

    const sections: { header: string; body: string[] }[] = []
    for (; i < lines.length && !lines[i]!.startsWith('=== '); i++) {
      const line = lines[i]!
      const sm = /^--- (.+)$/.exec(line)
      const word = sm?.[1]!.split(/\s/)[0]
      if (sm && word && SECTIONS.has(word)) sections.push({ header: sm[1]!.trim(), body: [] })
      else if (sections.length) sections[sections.length - 1]!.body.push(line)
      else if (line.trim()) fail(where, `text before the first "--- " section: ${line.slice(0, 40)}`)
    }

    const one = (name: string) => {
      const found = sections.filter((s) => s.header === name)
      if (found.length > 1) fail(where, `more than one "--- ${name}"`)
      return found[0]?.body
    }
    const teach = one('teach')
    const task = one('task')
    const starter = one('starter')
    const solution = one('solution')
    if (!teach || !task || !solution) fail(where, 'needs teach, task and solution')

    const checks = sections.filter((s) => s.header.startsWith('check')).map((s) => parseCheck(s.header, s.body, where))
    if (!checks.length) fail(where, 'needs at least one check')

    const stdin = one('stdin')
    const own = one('schema')
    const schema = own ? trimBlock(own) : trackSchema
    lessons.push({
      id,
      lang,
      title: head[2]!.trim(),
      teach: trimBlock(teach),
      task: trimBlock(task),
      starter: starter ? code(starter) : '',
      solution: code(solution),
      hints: sections.filter((s) => s.header === 'hint').map((s) => trimBlock(s.body)),
      checks,
      ...(stdin ? { stdin: code(stdin) } : {}),
      ...(schema ? { schema } : {}),
    })
  }

  const ids = new Set<string>()
  for (const l of lessons) {
    if (ids.has(l.id)) fail(file, `duplicate lesson id ${l.id}`)
    ids.add(l.id)
  }
  if (!lessons.length) fail(file, 'no lessons')
  return { lang, title: meta.title!, blurb: meta.blurb ?? '', lessons }
}
