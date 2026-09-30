/* ============================================================================
   ORBIT — the tutor for code that runs but is wrong
   ----------------------------------------------------------------------------
   No error, and still the wrong answer. That is where a beginner is most
   lost, because nothing says what happened. A person looking over her
   shoulder would recognise the shape of it straight away: braces printed as
   they are (the f was left off), "None" on a line of its own (a function
   that prints instead of returning), 55 where 10 was wanted (input() is
   text), 5.0 where 5 was wanted (/ always gives a decimal), only the last
   item printed (the print is outside the loop), the right rows in reverse
   order, a count squeezed into one row (GROUP BY left out), everything on
   one line (no '\n' in C++).

   Each detector pairs a symptom in what the run printed with its cause in
   her code, and only speaks when both are there: a guess would do more harm
   than saying nothing.
   ========================================================================== */
import type { CheckResult, LearnCheck, LearnLang } from './types'
import { code, nth, quote, type Diagnosis } from './tutorText'

export interface LogicInput {
  lang: LearnLang
  code: string
  solution: string
  output: string
  failed: CheckResult | undefined
  check: LearnCheck | undefined
  /** SQL: the tables the lesson starts with. */
  schema?: string
}

const lines = (s: string) => s.replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').replace(/\n+$/, '').split('\n')

/** What the failed check wanted, and what it got, as text. */
function wantGot(inp: LogicInput): { want: string; got: string } | null {
  const f = inp.failed
  if (!f) return null
  const c = inp.check
  const want = f.expected ?? (c?.kind === 'output' ? c.expect : c?.kind === 'includes' ? c.expect.join('\n') : null)
  if (want == null) return null
  const got = c?.kind === 'output' || c?.kind === 'includes' ? inp.output : (f.actual ?? '')
  return { want: want.replace(/\n\(in this order\)$/, ''), got: /^\((nothing printed|no rows)\)$/.test(got.trim()) ? '' : got }
}

/** Names given a value in Python code. */
const assigned = (src: string) => new Set([...src.matchAll(/^\s*([A-Za-z_]\w*)\s*=(?!=)/gm)].map((m) => m[1]!))
/** Functions defined in Python code. */
const defined = (src: string) => [...src.matchAll(/^\s*def\s+([A-Za-z_]\w*)\s*\(/gm)].map((m) => m[1]!)

/** Each function's body in Python code, by name. */
function functions(src: string): Map<string, string> {
  const out = new Map<string, string>()
  const ls = src.split('\n')
  ls.forEach((l, k) => {
    const m = /^(\s*)def\s+([A-Za-z_]\w*)\s*\(/.exec(l)
    if (!m) return
    const ind = m[1]!.length
    let end = k + 1
    while (end < ls.length && (!ls[end]!.trim() || ls[end]!.match(/^\s*/)![0].length > ind)) end++
    out.set(m[2]!, ls.slice(k + 1, end).join('\n'))
  })
  return out
}

/** A function's own lines, without the functions defined inside it (a decorator's wrapper has its own returns). */
function own(body: string): string {
  const out: string[] = []
  let skip = -1
  for (const l of body.split('\n')) {
    const ind = l.match(/^\s*/)![0].length
    if (skip >= 0 && (!l.trim() || ind > skip)) continue
    skip = -1
    if (/^\s*(?:async\s+)?def\s/.test(l)) {
      skip = ind
      continue
    }
    out.push(l)
  }
  return out.join('\n')
}

/** How many returns sit inside a loop, at any depth, in some code. */
function returnsInLoops(src: string): number {
  const ls = src.split('\n')
  let n = 0
  ls.forEach((l, k) => {
    if (!/^\s*return\b/.test(l)) return
    let ind = l.match(/^\s*/)![0].length
    for (let j = k - 1; j >= 0; j--) {
      const p = ls[j]!
      if (!p.trim()) continue
      const pi = p.match(/^\s*/)![0].length
      if (pi >= ind) continue
      if (/^\s*def\b/.test(p)) break
      if (/^\s*(for|while)\b.*:\s*$/.test(p)) {
        n++
        break
      }
      ind = pi
    }
  })
  return n
}

/**
 * Her function against the solution's function of the same name: one that prints its answer where the
 * solution returns it (so whatever calls it gets None), or returns from inside a loop where the solution
 * returns after it. Also the reading of a "None" crash: the None usually comes from one of these.
 */
export function functionDiagnosis(src: string, solution: string, call?: string): Diagnosis | null {
  const mine = new Map([...functions(src)].map(([k, v]) => [k, own(v)]))
  const theirs = new Map([...functions(solution)].map(([k, v]) => [k, own(v)]))
  const returns = (body: string) => /^\s*return\s+\S/m.test(body)
  for (const [fn, body] of theirs) {
    const hers = mine.get(fn)
    if (hers === undefined || !returns(body) || returns(hers) || !/\bprint\(/.test(hers)) continue
    const c = call?.trim()
    return { kind: 'logic', key: `prints-not-returns:${fn}`, say: `${code(fn)} prints its answer instead of giving it back, so ${c && c.length < 70 && c.includes(fn) ? `when the check calls ${code(c)}, it gets` : 'whatever calls it gets'} ${code('None')}.`, more: `Change ${code('print(…)')} to ${code('return …')} for the answer: printing only shows it on the screen.`, now: true }
  }
  // The last word of the function, a return at its own level, pushed into an if: when that isn't true, the
  // function reaches its end without returning.
  const level = (body: string) => Math.min(...body.split('\n').filter((l) => l.trim()).map((l) => l.match(/^\s*/)![0].length))
  const topReturn = (body: string) => body.split('\n').some((l) => /^\s*return\b/.test(l) && l.match(/^\s*/)![0].length === level(body))
  for (const [fn, body] of theirs) {
    const hers = mine.get(fn)
    if (hers === undefined || !body.trim() || !hers.trim() || !topReturn(body) || topReturn(hers)) continue
    const ls = hers.split('\n')
    const k = ls.findLastIndex((l) => /^\s*return\b/.test(l))
    if (k < 0) continue
    const ind = ls[k]!.match(/^\s*/)![0].length
    const header = ls.slice(0, k).findLast((l) => l.trim() && l.match(/^\s*/)![0].length < ind)?.trim()
    if (!header || !/^(?:if|elif|else|try|except|with)\b/.test(header)) continue
    return { kind: 'logic', key: `return-in-block:${fn}`, say: `In ${code(fn)}, the last ${code('return')} is inside ${code(header)}, so whenever that doesn't happen, the function reaches its end without returning, and gives back ${code('None')}${call && call.length < 70 && call.includes(fn) ? `, as it did for ${code(call.trim())}` : ''}.`, more: `Move that ${code('return')} one step to the left, out of the ${code(header.split(/\s|:/)[0]!)} block, so it runs every time.`, now: true }
  }
  for (const [fn, body] of theirs) {
    const hers = mine.get(fn)
    if (hers !== undefined && returnsInLoops(hers) > returnsInLoops(body))
      return { kind: 'logic', key: `return-in-loop:${fn}`, say: `In ${code(fn)}, a ${code('return')} is inside the loop, so the function hands back an answer the first time it gets there and never finishes the loop${/^\s*return\s/m.test(body) ? '. When the loop has nothing to go through, it gives back nothing at all' : ''}.`, more: `If the answer needs the whole loop, move that ${code('return')} out of it, one step to the left.`, now: true }
  }
  return null
}

function python(inp: LogicInput): Diagnosis | null {
  const src = inp.code
  const out = inp.output
  const wg = wantGot(inp)
  let m: RegExpMatchArray | null

  // A function never called: it ran nothing.
  for (const fn of defined(src)) {
    const calls = src.split('\n').filter((l) => !/^\s*def\s/.test(l) && new RegExp(`\\b${fn}\\s*\\(`).test(l)).length
    if (!calls && new RegExp(`\\b${fn}\\s*\\(`).test(inp.solution.replace(/^\s*def\s.*$/gm, '')))
      return { kind: 'logic', key: `uncalled:${fn}`, say: `You wrote the function ${code(fn)}, but nothing ever calls it, so it never ran.`, more: `Defining a function only teaches Python what it does. To run it, call it: ${code(`${fn}(…)`)}, and print what it gives back if you need to see it.`, now: true }
  }
  // A function written differently from the solution's in a way that explains a wrong answer.
  if (inp.failed) {
    const d = functionDiagnosis(src, inp.solution, inp.failed.input)
    if (d) return d
  }
  // The function itself printed, not its answer.
  if ((m = out.match(/<function (\w+) at 0x/)))
    return { kind: 'logic', key: `fn-object:${m[1]}`, say: `You printed the function ${code(m[1]!)} itself, not its answer: that's what ${quote(`<function ${m[1]} at …>`)} means.`, more: `Add brackets to call it: ${code(`${m[1]}()`)}.`, now: true }
  // Braces printed as they are: an f-string without its f.
  if ((m = `${out}\n${inp.failed?.actual ?? ''}`.match(/\{([A-Za-z_]\w*(?:[^}'"]*)?)\}/)) && !wg?.want.includes(`{${m[1]}}`) && !(inp.failed?.expected ?? '').includes(`{${m[1]}}`)) {
    const plain = new RegExp(`(?<![fF])(["'])[^"'\\n]*\\{${m[1]!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}`).test(src)
    if (plain)
      return { kind: 'logic', key: `no-f:${m[1]}`, say: `The ${code(`{${m[1]}}`)} was printed exactly as it's written, braces and all. That happens when the ${code('f')} before the quote is missing.`, more: `Put an ${code('f')} right before the opening quote, like ${code(`f"…{${m[1]}}…"`)}, and Python fills in the value.`, now: true }
  }
  // The same, seen in the code when the braces never reach the screen: a string with {name} in it and no f,
  // where the solution has the f.
  if (inp.failed)
    for (const lit of src.matchAll(/(?<![\w"'])(["'])([^"'\n]*\{[A-Za-z_][^}"'\n]*\}[^"'\n]*)\1/g)) {
      if (!inp.solution.includes(`f${lit[1]}${lit[2]}${lit[1]}`) && !inp.solution.includes(`F${lit[1]}${lit[2]}${lit[1]}`)) continue
      const name = /\{([A-Za-z_]\w*)/.exec(lit[2]!)![1]!
      return { kind: 'logic', key: `no-f:${name}`, say: `The string ${code(lit[0])} has no ${code('f')} in front, so ${code(`{${name}}`)} stays as those exact characters, braces and all, instead of the value.`, more: `Put an ${code('f')} right before the opening quote: ${code(`f${lit[0]}`)}.`, now: true }
    }
  // The variable's name printed, in quotes, instead of its value.
  for (const l of lines(out)) {
    const name = l.trim()
    if (/^[A-Za-z_]\w*$/.test(name) && assigned(src).has(name) && new RegExp(`print\\((["'])${name}\\1\\)`).test(src) && !wg?.want.split('\n').includes(name))
      return { kind: 'logic', key: `quoted:${name}`, say: `You printed the word ${code(name)}, not the value inside it: the quote marks make it plain text.`, more: `Take away the quotes: ${code(`print(${name})`)}.`, now: true }
  }
  // "None" printed: a function that prints and returns nothing, printed.
  if (lines(out).includes('None') && !wg?.want.split('\n').includes('None')) {
    const fn = defined(src).find((f) => new RegExp(`print\\(\\s*${f}\\(`).test(src))
    if (fn)
      return { kind: 'logic', key: `none-printed:${fn}`, say: `The ${quote('None')} comes from ${code(`print(${fn}(…))`)}: ${code(fn)} prints its answer itself and gives back nothing, so printing what it gives back shows None.`, more: `Either call it on its own line, ${code(`${fn}(…)`)}, or have it ${code('return')} the answer instead of printing it.`, now: true }
  }
  if (!wg) return null
  const want = lines(wg.want)
  const got = lines(wg.got)
  // Text joined instead of numbers added: input() is text.
  // The evidence: her digits split into two numbers that add up to the answer (5 and 5 in 55, for 10).
  const joined = (g: string, w: string) => [...g].some((_, k) => k > 0 && Number(g.slice(0, k)) + Number(g.slice(k)) === Number(w))
  if (/\binput\(/.test(src) && !/\b(int|float)\(\s*input\(/.test(src) && want.length === 1 && got.length === 1 && /^\d+$/.test(want[0]!) && /^\d{2,}$/.test(got[0]!) && joined(got[0]!, want[0]!))
    return { kind: 'logic', key: 'input-text', say: `${quote(got[0]!)} is two numbers stuck together, not added. ${code('input()')} always gives back text, and ${code('+')} on text joins it end to end.`, more: `Turn it into a number first: ${code('int(input())')}.`, now: true }
  // A decimal where a whole number was wanted, or the other way round.
  if (want.length === got.length) {
    const i = want.findIndex((w, k) => w !== got[k])
    const w = want[i] ?? ''
    const g = got[i] ?? ''
    if (/^-?\d+$/.test(w) && new RegExp(`^${w}\\.0+$`).test(g))
      return { kind: 'logic', key: 'decimal', say: `The answer is right but came out as ${code(g)}, a decimal, where the task wants ${code(w)}.`, more: `${code('/')} always gives a decimal in Python. For a whole number, use ${code('//')}, or wrap it in ${code('int()')}.`, now: true }
    if (/^-?\d+\.\d+$/.test(w) && /^-?\d+$/.test(g) && Math.trunc(Number(w)) === Number(g) && /\/\//.test(src))
      return { kind: 'logic', key: 'floor-div', say: `The answer lost its decimal part: ${code(g)} where it should be ${code(w)}.`, more: `${code('//')} divides and throws away the remainder. Use ${code('/')} for the exact answer.`, now: true }
  }
  // A whole list printed, brackets and all.
  if (got.length === 1 && /^\[.*\]$/.test(got[0]!) && want.length > 1)
    return { kind: 'logic', key: 'list-printed', say: 'You printed the whole list at once, brackets and all, and the task wants each item on its own line.', more: `Loop over it and print each one: ${code('for item in items:')} then ${code('print(item)')} indented under it.`, now: true }
  // Only the last item: the print is outside the loop.
  if (got.length === 1 && want.length > 1 && want[want.length - 1] === got[0]) {
    const outside = src.split('\n').findIndex((l, k, all) => /^\s*print\(/.test(l) && all.slice(0, k).some((p) => /^\s*for\b.*:\s*$/.test(p) && (p.match(/^\s*/)![0].length >= l.match(/^\s*/)![0].length)))
    if (outside >= 0)
      return { kind: 'logic', key: 'print-after-loop', say: 'Only the last one was printed. The print is outside the loop, so it runs once, after the loop has finished.', more: `Indent the ${code('print')} so it sits inside the loop, four spaces in, and it runs every time round.`, now: true }
  }
  // Every step printed: the print is inside the loop.
  if (want.length === 1 && got.length > 1 && got[got.length - 1] === want[0])
    return { kind: 'logic', key: 'print-in-loop', say: `The last line is right, but everything before it was printed too: the ${code('print')} is inside the loop, so it runs every time round.`, more: `Move it out of the loop, back to the left, so it runs once at the end.`, now: true }
  // A return inside the loop: the answer after one time round.
  const loopReturn = src.split('\n').some((l, k, all) => {
    const ind = l.match(/^\s*/)![0].length
    if (!/^\s*return\b/.test(l)) return false
    for (let j = k - 1; j >= 0; j--) {
      const p = all[j]!
      const pi = p.match(/^\s*/)![0].length
      if (p.trim() && pi < ind) return /^\s*for\b.*:\s*$/.test(p)
    }
    return false
  })
  const solutionLoopReturn = inp.solution.split('\n').some((l, k, all) => /^\s*return\b/.test(l) && /^\s*for\b/.test(all.slice(0, k).reverse().find((p) => p.trim() && p.match(/^\s*/)![0].length < l.match(/^\s*/)![0].length) ?? ''))
  if (loopReturn && !solutionLoopReturn && inp.failed)
    return { kind: 'logic', key: 'return-in-loop', say: `The ${code('return')} is inside the loop, so the function hands back an answer the very first time round and never looks at the rest.`, more: `Move ${code('return')} out of the loop, one step to the left, so it runs after the loop has been through everything.`, now: true }
  return null
}

/**
 * `INSERT INTO t (b, a) VALUES (1, 2)` where the solution lists `(a, b)`: every value goes into the column in
 * the same position, so they all land in the wrong place. Often seen first as a constraint failing.
 */
export function insertOrder(src: string, solution: string): Diagnosis | null {
  const lists = (t: string) => [...t.matchAll(/\bINSERT\s+(?:OR\s+\w+\s+)?INTO\s+(\w+)\s*\(([^)]*)\)/gi)].map((m) => ({ table: m[1]!.toLowerCase(), cols: m[2]!.split(',').map((c) => c.trim()) }))
  const theirs = lists(solution)
  for (const mine of lists(src)) {
    const ref = theirs.find((t) => t.table === mine.table && t.cols.length === mine.cols.length && [...t.cols].sort().join() === [...mine.cols].sort().join())
    if (!ref || ref.cols.join() === mine.cols.join()) continue
    const i = mine.cols.findIndex((c, k) => c !== ref.cols[k])
    return {
      kind: 'logic',
      key: `insert-order:${mine.table}`,
      say: `In ${code(`INSERT INTO ${mine.table} (${mine.cols.join(', ')})`)}, the columns are in a different order from the values, so values went into the wrong columns: the ${nth(i)} value went into ${code(mine.cols[i]!)}.`,
      more: `The values fill the columns in the order you list them. Put the columns in the same order as the values: ${code(`(${ref.cols.join(', ')})`)}.`,
      now: true,
    }
  }
  return null
}

/** A JOIN left without its ON, where the solution has one for every join: every row paired with every row. */
export function joinWithoutOn(src: string, solution: string): Diagnosis | null {
  const count = (re: RegExp, t: string) => (t.match(re) ?? []).length
  const joins = (t: string) => count(/\bJOIN\b/gi, t) - count(/\b(?:CROSS|NATURAL)\s+JOIN\b/gi, t)
  const ons = (t: string) => count(/\bON\b|\bUSING\b/gi, t)
  if (!joins(src) || ons(src) >= joins(src) || ons(solution) < joins(solution) || ons(src) >= ons(solution)) return null
  // The join that has none: its table, and what follows it up to the next clause.
  const table = [...src.matchAll(/\bJOIN\s+(\w+)([\s\S]*?)(?=\b(?:LEFT|RIGHT|INNER|FULL|CROSS|JOIN|WHERE|GROUP|ORDER|LIMIT|UNION)\b|;|$)/gi)].find((m) => !/\b(?:ON|USING)\b/i.test(m[2]!))?.[1]
  return {
    kind: 'logic',
    key: 'join-no-on',
    say: `${table ? `Your ${code(`JOIN ${table}`)}` : 'Your join'} has no ${code('ON')}, so the database paired every row of one table with every row of the other, instead of matching them up.`,
    more: `Say how the rows match, right after the table: ${code('JOIN b ON b.a_id = a.id')}.`,
    now: true,
  }
}

function sql(inp: LogicInput): Diagnosis | null {
  const src = inp.code
  const f = inp.failed
  // A comparison with NULL anywhere but an UPDATE's SET, where `= NULL` is how a value is emptied.
  const eqNull = (t: string) => /(?:[^<>!=]=|!=|<>)\s*NULL\b/i.test(t.replace(/\bSET\b[\s\S]*?(?=\bWHERE\b|;|$)/gi, ''))
  if (eqNull(src) && !eqNull(inp.solution))
    return { kind: 'logic', key: 'eq-null', say: `${code('= NULL')} is never true, not even for an empty value, because NULL means "unknown", and nothing equals unknown.`, more: `To find missing values, write ${code('IS NULL')}. To skip them, ${code('IS NOT NULL')}.`, now: true }
  const order = insertOrder(src, inp.solution)
  if (order && f) return order
  if (!f || (inp.check?.kind !== 'result' && inp.check?.kind !== 'query')) return null
  const want = (f.expected ?? '').replace(/\n\(in this order\)$/, '').split('\n').filter((l) => !/^… \d+ more$/.test(l))
  const got = (f.actual ?? '').split('\n').filter((l) => !/^… \d+ more$/.test(l) && l !== '(no rows)')
  const cells = (l: string) => l.split(' | ')
  const count = (re: RegExp, t: string) => (t.match(new RegExp(re.source, 'gi')) ?? []).length
  const fewer = (re: RegExp) => count(re, src) < count(re, inp.solution)
  // A total over everything, where one per group was wanted.
  if (got.length === 1 && want.length > 1 && /\b(COUNT|SUM|AVG|MIN|MAX)\s*\(/i.test(src) && fewer(/\bGROUP BY\b/))
    return { kind: 'logic', key: 'no-group', say: `${code(/\b(COUNT|SUM|AVG|MIN|MAX)\b/i.exec(src)![1]!.toUpperCase())} squeezed every row into one answer, and the task wants one answer for each group.`, more: `Add ${code('GROUP BY')} with the column to group on, after the WHERE and before ORDER BY.`, now: true }
  // The right values, columns in another order.
  const bag = (rows: string[]) => rows.map((r) => [...cells(r)].sort().join('|')).sort().join('\n')
  if (want.length && want.length === got.length && cells(want[0]!).length > 1 && want.join('\n') !== got.join('\n') && bag(want) === bag(got) && [...want].sort().join('\n') !== [...got].sort().join('\n'))
    return { kind: 'logic', key: 'column-order', say: 'Every value is right, but the columns are in a different order from what the task asks for.', more: `List the columns after ${code('SELECT')} in the order the task names them.`, now: true }
  // A join with no ON (or one join short of its ON): every row paired with every row.
  const noOn = joinWithoutOn(src, inp.solution)
  if (noOn) return got.length > want.length ? { ...noOn, say: `${noOn.say} That's why there are so many rows.` } : noOn
  // The top rows are right; there are just too many.
  if (got.length > want.length && want.length && want.every((w, k) => w === got[k]) && !/\bLIMIT\b/i.test(src) && /\bLIMIT\b/i.test(inp.solution))
    return { kind: 'logic', key: 'no-limit', say: `The first ${want.length} rows are exactly right. There are just more after them.`, more: `Keep only the top ones with ${code(`LIMIT ${want.length}`)} at the very end.`, now: true }
  // Reverse order.
  if (want.length > 1 && want.length === got.length && want.every((w, k) => w === got[got.length - 1 - k]))
    return { kind: 'logic', key: 'reversed', say: 'The rows are right but upside down: in exactly the reverse order.', more: /\bDESC\b/i.test(src) ? `Take away ${code('DESC')} to sort from low to high.` : `Add ${code('DESC')} after the ORDER BY column to sort from high to low.`, now: true }
  // The sort the wrong way round, when the solution sorts the other way.
  const dir = (t: string) => /\bORDER BY\b[^;]*\bDESC\b/i.test(t)
  if (/\bORDER BY\b/i.test(src) && /\bORDER BY\b/i.test(inp.solution) && dir(src) !== dir(inp.solution))
    return dir(inp.solution)
      ? { kind: 'logic', key: 'want-desc', say: 'Your rows are sorted from low to high, and the task wants them from high to low.', more: `Add ${code('DESC')} after the column in ${code('ORDER BY')}.`, now: true }
      : { kind: 'logic', key: 'want-asc', say: `Your rows are sorted from high to low, and the task wants them from low to high.`, more: `Take ${code('DESC')} away from the ${code('ORDER BY')}.`, now: true }
  // A clause the task needs that the query does not have.
  const clauses: [RegExp, string, string][] = [
    [/\bGROUP BY\b/i, 'GROUP BY', 'to get one row for each group'],
    [/\bWHERE\b/i, 'WHERE', 'to keep only the rows the task asks for'],
    [/\bHAVING\b/i, 'HAVING', 'to keep only the groups the task asks for'],
    [/\bDISTINCT\b/i, 'DISTINCT', 'so each row appears once'],
    [/\bJOIN\b/i, 'JOIN', 'to bring in the other table'],
    [/\bLIMIT\b/i, 'LIMIT', 'to keep only the top rows'],
    [/\bORDER BY\b/i, 'ORDER BY', 'to put the rows in order'],
  ]
  for (const [re, name, why] of clauses)
    if (fewer(re))
      return { kind: 'logic', key: `no-clause:${name}`, say: `The rows aren't the right ones yet, and your query has ${re.test(src) ? 'one' : 'no'} ${code(name)}${re.test(src) ? ' fewer than it needs' : ''}: the task needs one ${why}.`, more: `Add ${code(name)} in its place: SELECT, FROM, JOIN, WHERE, GROUP BY, HAVING, ORDER BY, LIMIT.`, now: false }
  // Duplicates of right rows: a join matching more than once, where DISTINCT or a tighter ON was wanted.
  if (got.length > want.length && new Set(got).size < got.length && [...new Set(got)].sort().join('\n') === [...new Set(want)].sort().join('\n'))
    return { kind: 'logic', key: 'duplicates', say: 'The right rows are there, but some come back more than once.', more: `A join can match a row several times. ${code('SELECT DISTINCT')} keeps one of each, or tighten the ${code('ON')} condition.`, now: true }
  return null
}

const squash = (s: string) => s.replace(/\s+/g, '')
/** A pattern for `s` as written, give or take spaces. */
const loose = (s: string) => s.trim().replace(/[.*+?^$()|[\]\\{}]/g, '\\$&').replace(/\s+/g, '\\s*')
const LONE_EQ = /(^|[^=!<>+\-*/%&|^])=(?!=)/

/** Each `if (…)` and `while (…)` condition in C-like code, with the line it starts on (from 1). */
function conditions(src: string): { text: string; line: number }[] {
  const out: { text: string; line: number }[] = []
  for (const m of src.matchAll(/\b(?:if|while)\s*\(/g)) {
    let depth = 1
    let i = m.index! + m[0].length
    const start = i
    for (; i < src.length && depth > 0; i++) depth += src[i] === '(' ? 1 : src[i] === ')' ? -1 : 0
    if (depth === 0) out.push({ text: src.slice(start, i - 1), line: src.slice(0, m.index).split('\n').length })
  }
  return out
}

/**
 * A condition that stores with one `=` where a comparison was surely meant: `if (count = 3)`. Not one the
 * solution writes too, and not a declaration made in the condition on purpose (`if (auto it = m.find(k); …)`).
 */
export function assignInCondition(src: string, solution = ''): { cond: string; fixed: string; line: number } | null {
  const theirs = new Set(conditions(solution).map((c) => squash(c.text)))
  for (const c of conditions(src)) {
    if (!LONE_EQ.test(c.text) || c.text.includes(';') || theirs.has(squash(c.text))) continue
    const fixed = c.text.replace(LONE_EQ, '$1==')
    if (!theirs.has(squash(fixed)) && /^\s*(?:const\s+)?[\w:<>]+[\s*&]+\w+\s*=(?!=)/.test(c.text)) continue
    return { cond: c.text.trim(), fixed: fixed.trim(), line: c.line }
  }
  return null
}

/** The line that explains `if (x = 5)`, shared with the compiler errors it can cause. */
export function assignSaid(a: { cond: string; fixed: string }, where: string): Diagnosis {
  const target = a.cond.split(LONE_EQ)[0]!.replace(/^[(!\s]+/, '').trim() || a.cond
  return {
    kind: 'logic',
    key: 'assign-in-if',
    say: `The condition ${code(`(${a.cond})`)}${where} uses one equals sign, which stores a value into ${code(target)} instead of comparing it.`,
    more: `To compare, use two: ${code(`(${a.fixed})`)}. One ${code('=')} sets, two ${code('==')} ask "is it equal?"`,
    now: true,
  }
}

function cpp(inp: LogicInput): Diagnosis | null {
  const src = inp.code
  const wg = wantGot(inp)
  // if (x = 5): an assignment where a comparison was meant.
  const assign = assignInCondition(src, inp.solution)
  if (assign && inp.failed) return assignSaid(assign, ` on line ${assign.line}`)
  // One step past the end: <= where the solution stops with <.
  const bound = [...src.matchAll(/for\s*\([^;]*;\s*(\w+)\s*<=\s*([^;]+);/g)].find((m) => new RegExp(`;\\s*${m[1]}\\s*<\\s*${loose(m[2]!)}\\s*;`).test(inp.solution))
  if (bound && inp.failed)
    return { kind: 'logic', key: 'one-past', say: `The loop ${code(`${bound[1]} <= ${bound[2]!.trim()}`)} runs one step too far: it also visits position ${code(bound[2]!.trim())}, which is just past the end.`, more: `Positions go from 0 up to one less than the size, so stop with ${code(`${bound[1]} < ${bound[2]!.trim()}`)}.`, now: true }
  if (!wg) return null
  const want = lines(wg.want)
  const got = lines(wg.got)
  if (want.length > 1 && got.length === 1 && got[0]!.replace(/\s+/g, '') === want.join('').replace(/\s+/g, ''))
    return { kind: 'logic', key: 'one-line', say: 'Everything came out on one line. C++ never starts a new line on its own.', more: `End each line you print with ${code("<< '\\n'")}.`, now: true }
  if (want.length === got.length) {
    const i = want.findIndex((w, k) => w !== got[k])
    const w = want[i] ?? ''
    const g = got[i] ?? ''
    if (/^-?\d+\.\d+$/.test(w) && /^-?\d+$/.test(g) && Math.trunc(Number(w)) === Number(g))
      return { kind: 'logic', key: 'int-division', say: `The answer lost its decimal part: ${code(g)} where it should be ${code(w)}. When both numbers are whole, C++ divides like whole numbers and drops the rest.`, more: `Make one of them a decimal: ${code('5.0 / 2')}, or ${code('static_cast<double>(total) / count')}.`, now: true }
  }
  // One step past the end: <= where < was meant, when the solution is written another way.
  if (/for\s*\([^;]*;\s*\w+\s*<=\s*[\w.]+(?:\.size\(\)|\.length\(\)|\bn\b)/.test(src) && !/<=/.test(inp.solution))
    return { kind: 'logic', key: 'one-past', say: `The loop runs one step too far: with ${code('<=')}, it also visits the position just past the end.`, more: `Positions go from 0 to size minus 1, so the condition is ${code('i < v.size()')}.`, now: true }
  return null
}

/** A mistake in code that ran without an error, recognised by what it printed and how it's written. */
export function logicDiagnosis(inp: LogicInput): Diagnosis | null {
  if (inp.lang === 'python') return python(inp)
  if (inp.lang === 'sql') return sql(inp)
  if (inp.lang === 'cpp') return cpp(inp)
  return null
}
