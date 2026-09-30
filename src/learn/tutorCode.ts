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
import { code, quote, type Diagnosis } from './tutorText'

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
  // The function itself printed, not its answer.
  if ((m = out.match(/<function (\w+) at 0x/)))
    return { kind: 'logic', key: `fn-object:${m[1]}`, say: `You printed the function ${code(m[1]!)} itself, not its answer: that's what ${quote(`<function ${m[1]} at …>`)} means.`, more: `Add brackets to call it: ${code(`${m[1]}()`)}.`, now: true }
  // Braces printed as they are: an f-string without its f.
  if ((m = out.match(/\{([A-Za-z_]\w*(?:[^}]*)?)\}/)) && !wg?.want.includes(`{${m[1]}}`)) {
    const plain = new RegExp(`(?<![fF])(["'])[^"'\\n]*\\{${m[1]!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}`).test(src)
    if (plain)
      return { kind: 'logic', key: `no-f:${m[1]}`, say: `The ${code(`{${m[1]}}`)} was printed exactly as it's written, braces and all. That happens when the ${code('f')} before the quote is missing.`, more: `Put an ${code('f')} right before the opening quote, like ${code(`f"…{${m[1]}}…"`)}, and Python fills in the value.`, now: true }
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

function sql(inp: LogicInput): Diagnosis | null {
  const src = inp.code
  const f = inp.failed
  if (/=\s*NULL\b/i.test(src) && !/\bIS\s+(NOT\s+)?NULL\b/i.test(src))
    return { kind: 'logic', key: 'eq-null', say: `${code('= NULL')} is never true, not even for an empty value, because NULL means "unknown", and nothing equals unknown.`, more: `To find missing values, write ${code('IS NULL')}. To skip them, ${code('IS NOT NULL')}.`, now: true }
  if (!f || inp.check?.kind !== 'result') return null
  const want = (f.expected ?? '').replace(/\n\(in this order\)$/, '').split('\n').filter((l) => !/^… \d+ more$/.test(l))
  const got = (f.actual ?? '').split('\n').filter((l) => !/^… \d+ more$/.test(l) && l !== '(no rows)')
  const cells = (l: string) => l.split(' | ')
  // A total over everything, where one per group was wanted.
  if (got.length === 1 && want.length > 1 && /\b(COUNT|SUM|AVG|MIN|MAX)\s*\(/i.test(src) && !/\bGROUP BY\b/i.test(src))
    return { kind: 'logic', key: 'no-group', say: `${code(/\b(COUNT|SUM|AVG|MIN|MAX)\b/i.exec(src)![1]!.toUpperCase())} squeezed every row into one answer, and the task wants one answer for each group.`, more: `Add ${code('GROUP BY')} with the column to group on, after the WHERE and before ORDER BY.`, now: true }
  // The right values, columns in another order.
  if (want.length && want.length === got.length && want.every((w, k) => w !== got[k] && [...cells(w)].sort().join('|') === [...cells(got[k]!)].sort().join('|')))
    return { kind: 'logic', key: 'column-order', say: 'Every value is right, but the columns are in a different order from what the task asks for.', more: `List the columns after ${code('SELECT')} in the order the task names them.`, now: true }
  // A join with no ON: every row paired with every row.
  if (/\bJOIN\b/i.test(src) && !/\bON\b|\bUSING\b/i.test(src) && got.length > want.length)
    return { kind: 'logic', key: 'join-no-on', say: `Without ${code('ON')}, the join paired every row of one table with every row of the other, which is why there are so many rows.`, more: `Say how the rows match: ${code('JOIN b ON a.id = b.a_id')}.`, now: true }
  // The top rows are right; there are just too many.
  if (got.length > want.length && want.length && want.every((w, k) => w === got[k]) && !/\bLIMIT\b/i.test(src) && /\bLIMIT\b/i.test(inp.solution))
    return { kind: 'logic', key: 'no-limit', say: `The first ${want.length} rows are exactly right. There are just more after them.`, more: `Keep only the top ones with ${code(`LIMIT ${want.length}`)} at the very end.`, now: true }
  // Reverse order.
  if (want.length > 1 && want.length === got.length && want.every((w, k) => w === got[got.length - 1 - k]))
    return { kind: 'logic', key: 'reversed', say: 'The rows are right but upside down: in exactly the reverse order.', more: /\bDESC\b/i.test(src) ? `Take away ${code('DESC')} to sort from low to high.` : `Add ${code('DESC')} after the ORDER BY column to sort from high to low.`, now: true }
  // Duplicates of right rows: a join matching more than once, where DISTINCT or a tighter ON was wanted.
  if (got.length > want.length && new Set(got).size < got.length && [...new Set(got)].sort().join('\n') === [...new Set(want)].sort().join('\n'))
    return { kind: 'logic', key: 'duplicates', say: 'The right rows are there, but some come back more than once.', more: `A join can match a row several times. ${code('SELECT DISTINCT')} keeps one of each, or tighten the ${code('ON')} condition.`, now: true }
  return null
}

function cpp(inp: LogicInput): Diagnosis | null {
  const src = inp.code
  const wg = wantGot(inp)
  // if (x = 5): an assignment where a comparison was meant.
  const assign = /\b(?:if|while)\s*\(([^()]*?[^=!<>])=([^=][^()]*)\)/.exec(src)
  if (assign && inp.failed)
    return { kind: 'logic', key: 'assign-in-if', say: `${code(assign[0])} sets ${code(assign[1]!.trim())} instead of comparing it: one equals sign stores a value, and that always counts as true unless it's zero.`, more: `To compare, use two equals signs: ${code(assign[0].replace(/([^=!<>])=([^=])/, '$1==$2'))}.`, now: true }
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
  // One step past the end: <= where < was meant.
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
