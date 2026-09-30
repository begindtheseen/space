/* ============================================================================
   ORBIT — the tutor: what a person beside her would say after a run fails
   ----------------------------------------------------------------------------
   When her code does not pass, the voice says something about this run: the
   error Python stopped on and the line it was on, the line of her output that
   is not what the check wanted, the call her function got wrong and what it
   gave back. Nothing generic when something specific can be said.

   It guides rather than tells. The first time it points at where the problem
   is; the next time it says what should be there; after that it brings in
   the lesson's own hints one at a time, then what the solution uses that her
   code does not, and only after several tries does it mention the solution.
   It notices progress (the error is gone, more checks pass), notices when
   she ran the same code again, and never says exactly the same thing twice
   in a row.

   Everything is worked out on the device from the run itself and the lesson:
   there is no model and no network behind it. It is a pure function, so
   every line it can say is testable.
   ========================================================================== */
import type { CheckResult, LearnCheck, LearnLang } from './types'
import { shellDiagnosis } from './tutorShell'
import { clip, code, distance, lowerFirst, nth, pick, quote, sentence, upperFirst, type Diagnosis, type DiagnosisKind } from './tutorText'

export type { DiagnosisKind } from './tutorText'

export interface TutorRun {
  results: CheckResult[]
  /** What she printed, without the checker's own lines. */
  output: string
  stderr: string
  error: string | null
}

/** What the tutor remembers about the previous run that failed on the same problem. */
export interface TutorMemory {
  code: string
  kind: DiagnosisKind
  key: string
  passing: number
}

export interface TutorInput {
  lang: LearnLang
  task: string
  hints: readonly string[]
  solution: string
  starter: string
  code: string
  /** The program that actually ran, when her code was wrapped, so line numbers map back to hers. */
  program?: string
  run: TutorRun
  /** The problem's checks, in the order of `run.results`, so each result is read as the kind of check it is. */
  checks?: readonly LearnCheck[]
  /** Which failed run on this problem this is, from 1. */
  attempt: number
  /** What was said after earlier runs on this problem, oldest first. */
  said: readonly string[]
  before?: TutorMemory | null
  /** Her name, used now and then, the way a person would. */
  name?: string
}

export interface TutorLine {
  /** What to say, as markdown: code in backticks is read the way a programmer says it. */
  text: string
  memory: TutorMemory
}

/* ── Small helpers ───────────────────────────────────────────────────────── */

/** Words that name things in code: identifiers, without keywords or anything inside strings and comments. */
function namesIn(src: string): Set<string> {
  const bare = src
    .replace(/(["'`])(?:\\.|(?!\1)[^\\\n])*\1/g, ' ')
    .replace(/#.*$|\/\/.*$/gm, ' ')
  return new Set(bare.match(/[A-Za-z_][A-Za-z0-9_]*/g) ?? [])
}

const BUILTINS: Partial<Record<LearnLang, string[]>> = {
  python: ['print', 'input', 'len', 'range', 'int', 'float', 'str', 'list', 'dict', 'set', 'tuple', 'sum', 'min', 'max', 'abs', 'round', 'sorted', 'enumerate', 'zip', 'map', 'filter', 'open', 'type', 'isinstance', 'True', 'False', 'None', 'append', 'return', 'def', 'import'],
  javascript: ['console', 'log', 'length', 'push', 'Math', 'parseInt', 'Number', 'String', 'Array', 'Object', 'JSON', 'return', 'const', 'let', 'function', 'true', 'false', 'null', 'undefined'],
  typescript: ['console', 'log', 'length', 'push', 'Math', 'parseInt', 'Number', 'String', 'Array', 'Object', 'JSON', 'return', 'const', 'let', 'function', 'true', 'false', 'null', 'undefined', 'number', 'string', 'boolean'],
  cpp: ['cout', 'cin', 'endl', 'std', 'vector', 'string', 'int', 'double', 'return', 'include', 'iostream', 'push_back', 'size', 'main', 'auto', 'const', 'bool', 'true', 'false'],
}

/** The name she most likely meant, when she wrote one that does not exist. */
function closestName(wrong: string, input: TutorInput): string | null {
  const pool = new Set([...namesIn(input.code), ...namesIn(input.solution), ...namesIn(input.starter), ...(BUILTINS[input.lang] ?? [])])
  pool.delete(wrong)
  let best: string | null = null
  let bestD = Infinity
  for (const n of pool) {
    if (n.toLowerCase() === wrong.toLowerCase()) return n
    const d = distance(n, wrong)
    if (d < bestD && d <= Math.max(1, Math.floor(wrong.length / 3))) {
      best = n
      bestD = d
    }
  }
  return best
}

/** Her line `n` (from 1), as she wrote it. */
const lineOf = (src: string, n: number) => src.split('\n')[n - 1] ?? ''

/**
 * The line of HER code an error points at. The checker may have put lines before hers, so line
 * numbers in the program are moved back by that much; a line past the end of hers is the
 * checker's own, calling her code, and is not hers to look at.
 */
function herLine(input: TutorInput, text: string): number | null {
  const offset = input.program && input.program.includes(input.code) ? input.program.slice(0, input.program.indexOf(input.code)).split('\n').length - 1 : 0
  const count = input.code.split('\n').length
  const found: number[] = []
  for (const m of text.matchAll(/(?:line |:)(\d+)(?::\d+)?(?=[,:\s)]|$)/g)) {
    const n = Number(m[1]) - offset
    if (n >= 1 && n <= count) found.push(n)
  }
  // Tracebacks list the call first and the line that failed last.
  return found.length ? found[found.length - 1]! : null
}

const at = (line: number | null) => (line ? ` on line ${line}` : '')

/* ── Errors, by language ─────────────────────────────────────────────────── */

const BLOCK_START = /^\s*(if|elif|else|for|while|def|class|try|except|finally|with)\b/

function pythonError(input: TutorInput, all: string, last: string): Diagnosis | null {
  const line = herLine(input, all)
  const src = line ? lineOf(input.code, line) : ''
  const where = at(line)
  let m: RegExpMatchArray | null

  if (/IndentationError|TabError/.test(all)) {
    if (/expected an indented block/.test(all))
      return { kind: 'error', key: `indent-expected:${line}`, say: `Python expected the line after the colon to be pushed in${where}.`, more: 'Everything inside an if, a loop or a function starts four spaces further in than the line with the colon.' }
    return { kind: 'error', key: `indent:${line}`, say: `The spacing at the start of the line is off${where}.`, more: 'Lines in the same block have to start at exactly the same place, all four spaces in, or all eight.' }
  }
  if (/SyntaxError/.test(all)) {
    if (/unterminated string|EOL while scanning|EOF while scanning triple/.test(all))
      return { kind: 'error', key: `string:${line}`, say: `A piece of text never closes${where}.`, more: 'Every quote mark that opens a string needs a matching one to close it, the same kind, on the same line.' }
    if ((m = all.match(/'([([{])' was never closed/)))
      return { kind: 'error', key: `unclosed:${line}`, say: `A bracket opens${where} and never closes.`, more: `Count them: every ${code(m[1]!)} needs its partner before the line ends.` }
    if (/unmatched '[)\]}]'|closing parenthesis/.test(all))
      return { kind: 'error', key: `unmatched:${line}`, say: `There's a closing bracket${where} with nothing open to close.`, more: 'Look for one extra bracket, or one that opens somewhere earlier and was left out.' }
    if (/expected ':'/.test(all) || (src && BLOCK_START.test(src) && !/:\s*(#.*)?$/.test(src)))
      return { kind: 'error', key: `colon:${line}`, say: `Line ${line ?? 'that starts the block'} is missing the colon at the end.`, more: `In Python a line that starts a block, like ${code(src.trim().split(/\s/)[0] || 'if')}, ends with a colon.` }
    if (/Maybe you meant '==' or ':=' instead of '='|cannot assign to/.test(all))
      return { kind: 'error', key: `assign:${line}`, say: `There's a single equals sign${where} where Python wanted a comparison.`, more: 'One equals sign stores a value. Two equals signs ask whether two things are the same.' }
    if (/Perhaps you forgot a comma/.test(all))
      return { kind: 'error', key: `comma:${line}`, say: `Something is missing between two things${where}, most likely a comma.`, more: 'Items in a list, or arguments to a call, are separated by commas.' }
    if (/print ["']|Missing parentheses in call to 'print'/.test(all))
      return { kind: 'error', key: `print-parens:${line}`, say: `print needs brackets around what it prints${where}.`, more: `Like this: ${code('print("hello")')}.` }
    return { kind: 'error', key: `syntax:${line}`, say: `Python couldn't read line ${line ?? 'one of your lines'}: something in how it's written is off.`, more: src ? `Read ${code(src)} slowly, one symbol at a time: a missing bracket, quote, colon or comma is usually the reason.` : 'Look for a missing bracket, quote, colon or comma.' }
  }
  if ((m = last.match(/NameError: name '(\w+)' is not defined/))) {
    const wrong = m[1]!
    const near = closestName(wrong, input)
    if (near && near.toLowerCase() === wrong.toLowerCase() && near !== wrong)
      return { kind: 'error', key: `name:${wrong}`, say: `Python doesn't know ${code(wrong)}${where}. Capital letters matter: it's ${code(near)}.` }
    if (near) return { kind: 'error', key: `name:${wrong}`, say: `Python doesn't know anything called ${code(wrong)}${where}. Did you mean ${code(near)}?` }
    if (input.solution.includes(`"${wrong}"`) || input.solution.includes(`'${wrong}'`))
      return { kind: 'error', key: `name:${wrong}`, say: `${code(wrong)}${where} is meant to be text, so it needs quote marks around it.` }
    return { kind: 'error', key: `name:${wrong}`, say: `Python doesn't know anything called ${code(wrong)}${where}.`, more: 'A name has to be given a value, with an equals sign, before the line that uses it.' }
  }
  if (/can only concatenate str|unsupported operand type\(s\) for \+: '(int|float)' and 'str'|unsupported operand type\(s\) for \+: 'str' and '(int|float)'/.test(last))
    return { kind: 'error', key: `concat:${line}`, say: `You're adding text and a number together${where}, and Python won't guess which you meant.`, more: `Turn the number into text first with ${code('str()')}, or put both inside an f-string.` }
  if ((m = last.match(/'(\w+)' object is not callable/)))
    return { kind: 'error', key: `callable:${m[1]}`, say: `Something${where} is being called like a function, but it's a ${m[1]}.`, more: 'Check for a name you used for a value and then called with brackets.' }
  if ((m = last.match(/(\w+)\(\) missing (\d+) required positional argument/)))
    return { kind: 'error', key: `missing-arg:${m[1]}`, say: `${code(`${m[1]}()`)} was called without everything it needs${where}.`, more: `It's missing ${m[2] === '1' ? 'one value' : `${m[2]} values`} in the brackets.` }
  if ((m = last.match(/(\w+)\(\) takes (\d+) positional arguments? but (\d+) (?:was|were) given/)))
    return { kind: 'error', key: `extra-arg:${m[1]}`, say: `${code(`${m[1]}()`)} was given ${m[3]} values but it only takes ${m[2]}${where}.` }
  if ((m = last.match(/'NoneType' object is not (subscriptable|iterable)/)) || /NoneType/.test(last))
    return { kind: 'error', key: `none:${line}`, say: `Something${where} is empty, it's None, when your code expected a value.`, more: 'That usually means a function printed its answer instead of returning it.' }
  if ((m = last.match(/'(\w+)' object has no attribute '(\w+)'/))) {
    const swap: Record<string, string> = { push: 'append', add: 'append', length: 'len()', size: 'len()', lower_case: 'lower', toUpperCase: 'upper', toLowerCase: 'lower' }
    const better = swap[m[2]!]
    return { kind: 'error', key: `attr:${m[1]}.${m[2]}`, say: `A ${m[1]} doesn't have ${code(m[2]!)}${where}.${better ? ` You want ${code(better)}.` : ''}`, more: better ? undefined : 'Check the spelling of the method, and what kind of value it is being called on.' }
  }
  if ((m = last.match(/invalid literal for int\(\) with base 10: '([^']*)'/)))
    return { kind: 'error', key: `int-literal:${line}`, say: `${code('int()')} was handed ${quote(m[1]!)}${where}, which isn't a whole number.`, more: 'Only text that is all digits can become an int.' }
  if (/IndexError/.test(last))
    return { kind: 'error', key: `index:${line}`, say: `Your code asked for a position past the end of the list${where}.`, more: 'Positions start at 0, so the last one is the length minus one.' }
  if ((m = last.match(/KeyError: (.+)$/)))
    return { kind: 'error', key: `key:${m[1]}`, say: `There's no key ${m[1]!.trim()} in the dictionary${where}.`, more: `Check the spelling, or use ${code('.get()')} if the key might not be there.` }
  if ((m = last.match(/UnboundLocalError: .*?'(\w+)'/)))
    return { kind: 'error', key: `unbound:${m[1]}`, say: `${code(m[1]!)} is used${where} before it has been given a value.`, more: 'Check every path through your code: on one of them, maybe inside an if or an except, it never gets set.' }
  if (/ZeroDivisionError/.test(last))
    return { kind: 'error', key: `zero:${line}`, say: `Your code divided by zero${where}.`, more: 'Check what the number underneath is at that moment, and whether an empty list could make it zero.' }
  if (/RecursionError/.test(last))
    return { kind: 'error', key: 'recursion', say: 'Your function keeps calling itself and never stops.', more: 'It needs a case where it returns an answer without calling itself again.' }
  if (/ModuleNotFoundError|ImportError/.test(last))
    return { kind: 'error', key: `import:${line}`, say: `Python couldn't find what you tried to import${where}.`, more: 'Check the spelling of the module name.' }
  if ((m = last.match(/^(\w+Error): (.+)$/m)))
    return { kind: 'error', key: `${m[1]}:${line}`, say: `Python stopped${where} with ${/^[AEIOU]/.test(m[1]!) ? 'an' : 'a'} ${m[1]!.replace(/Error$/, ' error')}: ${clip(m[2]!, 90)}.` }
  return null
}

function jsError(input: TutorInput, all: string, last: string): Diagnosis | null {
  const line = herLine(input, all)
  const where = at(line)
  let m: RegExpMatchArray | null
  if ((m = last.match(/ReferenceError: (\w+) is not defined/) ?? all.match(/Cannot find name '(\w+)'/))) {
    const wrong = m[1]!
    const near = closestName(wrong, input)
    return { kind: 'error', key: `name:${wrong}`, say: near ? `There's nothing called ${code(wrong)}${where}. Did you mean ${code(near)}?` : `There's nothing called ${code(wrong)}${where}.`, more: near ? undefined : `Declare it first with ${code('const')} or ${code('let')}.` }
  }
  if ((m = last.match(/TypeError: (\S+) is not a function/)))
    return { kind: 'error', key: `not-fn:${m[1]}`, say: `${code(m[1]!)} isn't a function${where}.`, more: 'Check the spelling, and that it is a method of the kind of value you called it on.' }
  if ((m = last.match(/Cannot read propert(?:y|ies) of (undefined|null)(?: \(reading '(\w+)'\))?/)))
    return { kind: 'error', key: `of-undefined:${m[2] ?? ''}`, say: `Your code asked for ${m[2] ? code(m[2]) : 'a property'} of something that is ${m[1]}${where}.`, more: 'The value before the dot has not been set yet, or the function that made it did not return anything.' }
  if ((m = all.match(/Type '([^']+)' is not assignable to type '([^']+)'/)))
    return { kind: 'error', key: `ts-assign:${m[1]}:${m[2]}`, say: `TypeScript says a ${m[1]} can't go where a ${m[2]} is expected${where}.`, more: 'Either the value or the type written for it needs to change so they agree.' }
  if ((m = all.match(/Property '(\w+)' does not exist on type '([^']+)'/)))
    return { kind: 'error', key: `ts-prop:${m[1]}`, say: `TypeScript says ${code(m[1]!)} doesn't exist on a ${m[2]}${where}.` }
  if (/SyntaxError|Unexpected token|Unexpected end of input|missing \)/.test(all))
    return { kind: 'error', key: `syntax:${line}`, say: `JavaScript couldn't read your code${where}.`, more: 'Look for a bracket or brace that opens and never closes, or a missing quote.' }
  if ((m = last.match(/^(\w*Error): (.+)$/m)))
    return { kind: 'error', key: `${m[1]}:${line}`, say: `Your code stopped${where} with ${m[1]}: ${clip(m[2]!, 90)}.` }
  return null
}

function cppError(input: TutorInput, all: string): Diagnosis | null {
  const first = all.match(/:(\d+):\d+: (?:fatal )?error: (.+)/)
  const offset = input.program && input.program.includes(input.code) ? input.program.slice(0, input.program.indexOf(input.code)).split('\n').length - 1 : 0
  const n = first ? Number(first[1]) - offset : 0
  const line = n >= 1 && n <= input.code.split('\n').length ? n : null
  const msg = first?.[2] ?? all.split('\n').find((l) => /error/.test(l)) ?? ''
  const where = at(line)
  let m: RegExpMatchArray | null
  const suggest = msg.match(/did you mean '([\w:]+)'/)?.[1]
  if ((m = msg.match(/no member named '(\w+)' in namespace 'std'/)))
    return { kind: 'error', key: `std-member:${m[1]}`, say: `There's nothing called ${code(m[1]!)} in the standard library${where}.${suggest ? ` Did you mean ${code(suggest)}?` : ''}` }
  if ((m = msg.match(/unknown type name '(\w+)'/)))
    return { kind: 'error', key: `type:${m[1]}`, say: `The compiler doesn't know a type called ${code(m[1]!)}${where}.${suggest ? ` Did you mean ${code(suggest)}?` : ''}`, more: suggest ? undefined : 'Check the spelling, and that the header it comes from is included.' }
  if (/expected ';'/.test(msg))
    return { kind: 'error', key: `semicolon:${line}`, say: `A semicolon is missing${line ? ` at the end of line ${Math.max(1, line - (/before/.test(msg) ? 1 : 0))}` : ''}.`, more: 'In C++ every statement ends with a semicolon.' }
  if ((m = msg.match(/(?:use of undeclared identifier|'?(\w+)'? was not declared in this scope)\s*'?(\w+)?'?/))) {
    const wrong = m[1] ?? m[2] ?? ''
    if (/^(cout|cin|endl|string|vector)$/.test(wrong))
      return { kind: 'error', key: `std:${wrong}`, say: `The compiler doesn't recognise ${code(wrong)}${where}.`, more: `It lives in the standard library: write ${code(`std::${wrong}`)}, and include the header it comes from.` }
    const near = suggest ?? (wrong ? closestName(wrong, input) : null)
    return { kind: 'error', key: `name:${wrong}`, say: `The compiler doesn't know ${code(wrong)}${where}.${near ? ` Did you mean ${code(near)}?` : ''}`, more: near ? undefined : 'Declare it, with its type, before the line that uses it.' }
  }
  if (/no matching function|no match for 'operator/.test(msg))
    return { kind: 'error', key: `match:${line}`, say: `Something${where} is being used with the wrong kind of value.`, more: 'Check the types of what you pass in against what the function or operator expects.' }
  if (/cannot convert|invalid conversion/.test(msg))
    return { kind: 'error', key: `convert:${line}`, say: `A value${where} is the wrong type for where it's going.` }
  if (/expected '}'|expected '\)'|expected unqualified-id|expected expression/.test(msg))
    return { kind: 'error', key: `brace:${line}`, say: `The compiler got lost${where}: a bracket or brace is missing or extra.`, more: 'Every opening brace needs a closing one; count them in the lines just above.' }
  if (/undefined reference to `?main/.test(all))
    return { kind: 'error', key: 'main', say: 'The program has no main function to start from.' }
  if (msg) return { kind: 'error', key: `cpp:${clip(msg, 30)}`, say: sentence(`The compiler stopped${where}: ${clip(msg.replace(/‘|’/g, "'").replace(/;\s*did you mean '([\w:]+)'\?/, '. Did you mean $1?'), 100)}`) }
  return null
}

function sqlError(input: TutorInput, all: string): Diagnosis | null {
  let m: RegExpMatchArray | null
  if ((m = all.match(/no such column: ([\w.]+)/))) {
    const wrong = m[1]!.split('.').pop()!
    const near = closestName(wrong, { ...input, solution: `${input.solution}` })
    return { kind: 'error', key: `column:${wrong}`, say: `There's no column called ${code(wrong)}.${near ? ` Did you mean ${code(near)}?` : ''}`, more: near ? undefined : 'Check the table: the column names are listed above the task.' }
  }
  if ((m = all.match(/no such table: (\w+)/))) {
    const near = closestName(m[1]!, input)
    return { kind: 'error', key: `table:${m[1]}`, say: `There's no table called ${code(m[1]!)}.${near ? ` Did you mean ${code(near)}?` : ''}` }
  }
  if ((m = all.match(/no such function: (\w+)/))) {
    const fns = ['LOWER', 'UPPER', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'LENGTH', 'SUBSTR', 'ROUND', 'COALESCE', 'IFNULL', 'DATE', 'STRFTIME', 'ABS', 'TRIM', 'REPLACE', 'INSTR', 'GROUP_CONCAT', 'TOTAL', 'TYPEOF', 'CAST', 'JULIANDAY', 'NULLIF', 'PRINTF']
    const wrong = m[1]!
    const near = fns.map((f) => [f, distance(f, wrong.toUpperCase())] as const).sort((a, b) => a[1] - b[1])[0]!
    return { kind: 'error', key: `fn:${wrong}`, say: `There's no function called ${code(wrong)}.${near[1] <= 2 ? ` Did you mean ${code(near[0])}?` : ''}` }
  }
  if (/near ";": syntax error/.test(all))
    return { kind: 'error', key: 'near-end', say: 'The query stops before it is finished: something is missing just before the end.', more: 'Look at the last clause: a condition with nothing after AND, or a comma with nothing after it.' }
  if ((m = all.match(/near "([^"]+)": syntax error/)))
    return { kind: 'error', key: `near:${m[1]}`, say: `The database got confused just before ${code(m[1]!)}.`, more: 'Check the word right before it: a missing comma, a misspelt keyword, or clauses in the wrong order. The order is SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY.' }
  if (/ambiguous column name: (\w+)/.test(all))
    return { kind: 'error', key: 'ambiguous', say: 'A column name appears in both tables, so the database doesn\'t know which one you mean.', more: `Put the table's name in front of it, like ${code('orders.id')}.` }
  if (/misuse of aggregate/.test(all))
    return { kind: 'error', key: 'aggregate', say: 'A total like COUNT or SUM is being used somewhere it can\'t go.', more: 'Conditions on a total go in HAVING, after GROUP BY, not in WHERE.' }
  if (/incomplete input/.test(all)) return { kind: 'error', key: 'incomplete', say: 'The query stops before it is finished.', more: 'Check for a bracket or quote that never closes.' }
  const first = all.trim().split('\n')[0]
  return first ? { kind: 'error', key: `sql:${clip(first, 30)}`, say: `The database said: ${clip(first, 100)}.` } : null
}

function shellError(input: TutorInput, all: string): Diagnosis | null {
  const m = all.match(/(?:command not found: (\S+)|(\S+): command not found)/)
  if (m) {
    const wrong = m[1] ?? m[2]!
    const near = closestName(wrong, { ...input, code: `${input.code} ls cd pwd mkdir touch cat echo grep git rm mv cp head tail wc sort uniq` })
    return { kind: 'error', key: `command:${wrong}`, say: `The terminal doesn't have a command called ${code(wrong)}.${near ? ` Did you mean ${code(near)}?` : ''}` }
  }
  return null
}

function errorDiagnosis(input: TutorInput): Diagnosis | null {
  const { run } = input
  const all = `${run.stderr}\n${run.error ?? ''}`.trim()
  if (!all) return null
  if (/timed? ?out|took too long|Time limit|infinite loop/i.test(all))
    return { kind: 'timeout', key: 'timeout', say: 'Your code ran for too long and had to be stopped, which usually means a loop that never ends.', more: 'Look at what is supposed to change each time round the loop, and check that it really does, so the condition becomes false.' }
  const last = (run.error ?? all).trim().split('\n').filter(Boolean).pop() ?? ''
  switch (input.lang) {
    case 'python':
      return pythonError(input, all, last)
    case 'javascript':
    case 'typescript':
    case 'html':
      return jsError(input, all, last)
    case 'cpp':
      return cppError(input, all)
    case 'sql':
      return sqlError(input, all)
    case 'bash':
    case 'git':
      return shellError(input, all)
  }
}

/* ── Output that is not what the check wanted ────────────────────────────── */

const lines = (s: string) => s.replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').replace(/\n+$/, '').split('\n')
const numeric = (s: string) => /^-?\d+(?:\.\d+)?$/.test(s.trim())

/** Says what differs between the output wanted and hers, pointing first, then telling. */
function outputDiagnosis(expected: string, actual: string, what = 'your output'): Diagnosis {
  const want = lines(expected)
  const got = lines(actual)
  if (!actual.trim())
    return { kind: 'empty', key: 'empty', say: 'Nothing was printed, and the check is looking for output.', more: `Remember to print the result: working it out isn't the same as showing it. It should start with ${quote(want[0] ?? '')}.` }
  if (expected.trim().toLowerCase() === actual.trim().toLowerCase()) {
    const i = want.findIndex((l, k) => l !== got[k])
    return { kind: 'output', key: 'case', say: `It's only capital letters: ${what} matches except for upper and lower case.`, more: `It should be ${quote(want[i] ?? want[0]!)}, and yours is ${quote(got[i] ?? got[0]!)}.` }
  }
  const squash = (s: string) => s.replace(/\s+/g, '')
  if (squash(expected) === squash(actual))
    return { kind: 'output', key: 'spacing', say: `The words are right, but the spaces or line breaks in ${what} aren't quite the same.`, more: `Compare it with ${quote(want.join(' / '))}: look for an extra or missing space.` }
  const bare = (s: string) => s.replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim().toLowerCase()
  if (bare(expected) === bare(actual)) {
    const i = want.findIndex((l, k) => l !== got[k])
    const w = want[i] ?? ''
    const g = got[i] ?? ''
    let j = 0
    while (j < w.length && w[j] === g[j]) j++
    const missing = w[j]
    const name: Record<string, string> = { '!': 'exclamation mark', '.': 'full stop', ',': 'comma', ':': 'colon', '?': 'question mark', '"': 'quote mark', "'": 'apostrophe', '-': 'dash', ';': 'semicolon' }
    const thing = missing && name[missing] ? `a ${name[missing]}` : 'a punctuation mark'
    return { kind: 'output', key: `punct:${i}`, say: `Nearly word for word. The difference is punctuation: ${thing}.`, more: `Line ${i + 1} should read ${quote(w)}.` }
  }
  if (want.length !== got.length) {
    const fewer = got.length < want.length
    const i = fewer ? want.findIndex((l, k) => l !== got[k]) : got.findIndex((l, k) => l !== want[k])
    return {
      kind: 'output',
      key: `count:${got.length}/${want.length}`,
      say: `${upperFirst(what)} has ${got.length} ${got.length === 1 ? 'line' : 'lines'}, and the check expects ${want.length}.`,
      more: fewer
        ? `The ${nth(i < 0 ? got.length : i)} line should be ${quote(want[i < 0 ? got.length : i] ?? '')}.`
        : `The ${nth(i < 0 ? want.length : i)} line, ${quote(got[i < 0 ? want.length : i] ?? '')}, is one too many.`,
    }
  }
  const i = want.findIndex((l, k) => l !== got[k])
  const w = want[i] ?? ''
  const g = got[i] ?? ''
  if (numeric(w) && numeric(g)) {
    const d = Number(g) - Number(w)
    if (Math.abs(d) === 1)
      return { kind: 'output', key: `off-by-one:${i}`, say: `So close: ${what} is off by one on the ${nth(i)} line, ${g} where it should be ${w}.`, more: 'Check where your loop or range starts and stops: one end is probably one too far, or not far enough.' }
    if (Math.abs(d) < 0.01 * Math.max(1, Math.abs(Number(w))) || w.length !== g.length)
      return { kind: 'output', key: `round:${i}`, say: `The number on the ${nth(i)} line is right, but it isn't rounded the way the check wants.`, more: `It should show exactly ${w}, and yours shows ${g}.` }
    return { kind: 'output', key: `number:${i}`, say: `The ${nth(i)} line of ${what} has the wrong number.`, more: `It should be ${w}, and yours is ${g}. Work through the steps by hand for this one.` }
  }
  return { kind: 'output', key: `line:${i}`, say: `The ${nth(i)} line of ${what} isn't what the check expects.`, more: `It should say ${quote(w)}, and yours says ${quote(g)}.` }
}

/* ── One failed check ────────────────────────────────────────────────────── */

const EMPTY = /^(?:None|undefined|null|nothing|\(nothing\)|\(nothing printed\)|\(no rows\)|)$/

/** A test case: a call, what it should give, what hers gave. */
function caseDiagnosis(miss: CheckResult, input: TutorInput): Diagnosis {
  const call = (miss.input ?? '').trim()
  const expected = (miss.expected ?? '').trim()
  const actual = (miss.actual ?? '').trim()
  if (/Error|Traceback|exception/i.test(actual)) {
    const inner = errorDiagnosis({ ...input, program: undefined, run: { ...input.run, stderr: actual, error: actual.split('\n').pop() ?? actual } })
    const why = inner && inner.kind === 'error' ? ` ${inner.say}` : ` It said ${quote(actual.split('\n').pop() ?? actual)}.`
    return { kind: 'case', key: `case-crash:${inner?.key ?? call}`, say: `When the check called ${code(call)}, your code stopped with an error.${why}`, more: inner?.more ?? 'Try that call yourself and follow what happens.' }
  }
  if (EMPTY.test(actual) && !EMPTY.test(expected)) {
    const printed = !!expected && input.run.output.includes(expected)
    return {
      kind: 'case',
      key: `case-none:${call}`,
      say: printed
        ? `Your function prints the answer, but it doesn't give it back. When the check calls ${code(call)}, it gets nothing.`
        : `When the check calls ${code(call)}, your function doesn't give anything back.`,
      more: `A function hands back its answer with ${code('return')}. Printing it only shows it on the screen.`,
    }
  }
  if (numeric(actual) && numeric(expected) && Math.abs(Number(actual) - Number(expected)) === 1)
    return { kind: 'case', key: `case-off:${call}`, say: `For ${code(call)} your answer is off by one.`, more: `It should be ${expected}, and yours gives ${actual}. Check where a loop or range starts and stops.` }
  if (/\n/.test(expected) || expected.length > 70)
    return { ...outputDiagnosis(expected, actual, `what ${code(call)} gives`), kind: 'case', key: `case-long:${call}` }
  return { kind: 'case', key: `case:${call}:${actual}`, say: `Your code gets ${code(call)} wrong.`, more: `It should give ${code(expected)}, and yours gives ${code(actual || 'nothing')}.` }
}

function rowsDiagnosis(miss: CheckResult, ordered: boolean): Diagnosis {
  const want = (miss.expected ?? '').replace(/\n\(in this order\)$/, '')
  const got = miss.actual ?? ''
  if (EMPTY.test(got.trim()))
    return { kind: 'rows', key: 'rows-none', say: miss.detail ? sentence(miss.detail) : 'Your query gave back no rows at all.', more: 'Run it on its own and look at what comes back: the WHERE condition may be ruling everything out.' }
  const w = want.split('\n').filter((l) => !/^… \d+ more$/.test(l))
  const g = got.split('\n').filter((l) => !/^… \d+ more$/.test(l))
  const count = (t: string) => {
    const more = t.match(/… (\d+) more$/)
    return t.split('\n').filter((l) => !/^… \d+ more$/.test(l)).length + (more ? Number(more[1]) : 0)
  }
  const nw = count(want)
  const ng = count(got)
  if (nw !== ng)
    return {
      kind: 'rows',
      key: `rows-count:${ng}/${nw}`,
      say: `Your query gives back ${ng} ${ng === 1 ? 'row' : 'rows'}, and it should give ${nw}.`,
      more: ng > nw ? 'Too many rows usually means a condition is missing from WHERE, or a JOIN is matching more than it should.' : 'Too few rows usually means the WHERE condition is stricter than the task asks for.',
    }
  const cols = (l: string) => l.split(' | ').length
  if (w[0] && g[0] && cols(w[0]) !== cols(g[0]))
    return { kind: 'rows', key: 'rows-columns', say: `Each row should have ${cols(w[0])} ${cols(w[0]) === 1 ? 'column' : 'columns'}, and yours have ${cols(g[0])}.`, more: 'Check the list of columns right after SELECT.' }
  if (ordered && [...w].sort().join('\n') === [...g].sort().join('\n'))
    return { kind: 'rows', key: 'rows-order', say: 'The rows are right. Only their order is off.', more: 'Sort them with ORDER BY, and think about whether it should be from low to high or high to low.' }
  const i = w.findIndex((l, k) => l !== g[k])
  return { kind: 'rows', key: `rows:${i}`, say: `The ${nth(Math.max(0, i))} row your query gives back isn't the one the check expects.`, more: `It should be ${quote(w[i] ?? '')}, and yours is ${quote(g[i] ?? '')}.` }
}

function checkDiagnosis(miss: CheckResult, check: LearnCheck | undefined, input: TutorInput): Diagnosis {
  const detail = miss.detail ? sentence(miss.detail) : ''
  const hint = miss.hint ? sentence(miss.hint) : ''
  const printed = EMPTY.test((miss.actual ?? '').trim()) ? '' : input.run.output
  switch (check?.kind) {
    case 'output':
      return outputDiagnosis(miss.expected ?? check.expect, printed)
    case 'includes': {
      if (!printed.trim()) return outputDiagnosis(check.expect.join('\n'), '')
      const missing = check.expect.filter((e) => !printed.includes(e.trim()))
      return {
        kind: 'output',
        key: `includes:${missing[0] ?? ''}`,
        say: `${missing.length > 1 ? `${missing.length} things the check looks for aren't` : 'Something the check looks for isn\'t'} in your output yet.`,
        more: `It's looking for ${missing.slice(0, 2).map(quote).join(' and ')}.`,
      }
    }
    case 'case':
      return caseDiagnosis(miss, input)
    case 'test': {
      const actual = (miss.actual ?? '').trim()
      if (/Error|Traceback/i.test(actual))
        return { kind: 'case', key: `test-crash:${miss.input}`, say: `The check ${code(miss.input ?? check.expr)} crashed your code.`, more: `It said ${quote(actual.split('\n').pop() ?? actual)}.` }
      return { kind: 'check', key: `test:${check.expr}`, say: `This check comes out false: ${lowerFirst(sentence(miss.name))}`, more: hint || `The check tests ${code(miss.input ?? check.expr)}.` }
    }
    case 'result':
      return rowsDiagnosis(miss, check.ordered)
    case 'shell': {
      // The terminal says exactly what is not true yet ("you have not run pwd yet"): first the goal, then that.
      const now = (miss.actual ?? miss.detail ?? '').trim()
      return {
        kind: 'check',
        key: `shell:${miss.name}:${now}`,
        say: `The check ${quote(miss.name.replace(/\.$/, ''))} isn't passing yet.`,
        more: [now ? `Right now, ${lowerFirst(now.replace(/\.$/, ''))}.` : '', hint].filter(Boolean).join(' ') || undefined,
      }
    }
    default:
      return {
        kind: 'check',
        key: `check:${miss.name}`,
        say: `The check ${quote(miss.name.replace(/\.$/, ''))} isn't passing yet.${detail && !detail.toLowerCase().includes(miss.name.toLowerCase()) ? ` ${detail}` : ''}`,
        more: hint || undefined,
      }
  }
}

/* ── What the solution uses that her code does not ───────────────────────── */

const CONSTRUCTS: Partial<Record<LearnLang, [RegExp, string][]>> = {
  python: [
    [/\bfor\b/, 'a `for` loop'], [/\bwhile\b/, 'a `while` loop'], [/\bif\b/, 'an `if`'], [/\breturn\b/, '`return`'],
    [/\bdef\b/, 'a function, made with `def`'], [/\bappend\(/, '`append`'], [/\brange\(/, '`range`'], [/\blen\(/, '`len`'],
    [/\binput\(/, '`input`'], [/\bf["']/, 'an f-string'], [/\bsum\(/, '`sum`'], [/\bsorted\(|\.sort\(/, 'sorting'],
    [/\bsplit\(/, '`split`'], [/\bjoin\(/, '`join`'], [/\bprint\(/, '`print`'],
  ],
  javascript: [[/\bfor\b/, 'a `for` loop'], [/\bif\b/, 'an `if`'], [/\breturn\b/, '`return`'], [/\.map\(/, '`map`'], [/\.filter\(/, '`filter`'], [/\.reduce\(/, '`reduce`'], [/`/, 'a template string'], [/console\.log/, '`console.log`']],
  typescript: [[/\bfor\b/, 'a `for` loop'], [/\bif\b/, 'an `if`'], [/\breturn\b/, '`return`'], [/\.map\(/, '`map`'], [/\.filter\(/, '`filter`'], [/\binterface\b/, 'an `interface`'], [/\btype\b/, 'a `type`']],
  cpp: [[/\bfor\b/, 'a `for` loop'], [/\bwhile\b/, 'a `while` loop'], [/\bif\b/, 'an `if`'], [/\breturn\b/, '`return`'], [/push_back/, '`push_back`'], [/\bcout\b/, '`cout`'], [/\bcin\b/, '`cin`'], [/\bvector\b/, 'a `vector`']],
  sql: [[/\bWHERE\b/i, 'a `WHERE` condition'], [/\bGROUP BY\b/i, '`GROUP BY`'], [/\bORDER BY\b/i, '`ORDER BY`'], [/\bJOIN\b/i, 'a `JOIN`'], [/\bHAVING\b/i, '`HAVING`'], [/\bCOUNT\(/i, '`COUNT`'], [/\bSUM\(/i, '`SUM`'], [/\bAVG\(/i, '`AVG`'], [/\bDISTINCT\b/i, '`DISTINCT`'], [/\bLIMIT\b/i, '`LIMIT`'], [/\bDESC\b/i, 'sorting from high to low, `DESC`']],
}

function missingConstruct(input: TutorInput): string | null {
  const strip = (s: string) => s.replace(/#.*$|\/\/.*$|--.*$/gm, '')
  const sol = strip(input.solution)
  const mine = strip(input.code)
  for (const [re, say] of CONSTRUCTS[input.lang] ?? []) if (re.test(sol) && !re.test(mine)) return say
  return null
}

/* ── Saying it ───────────────────────────────────────────────────────────── */

const OPEN_FIRST = ['Nice try, but', 'Good try, but', 'Not quite yet:', 'Almost:', 'Close, but']
const OPEN_AGAIN = ['Still not quite.', "Let's look again.", 'Okay, one more look.', "We're getting there."]
const OPEN_HARD = ["This one's tricky, and that's completely fine.", "Hang in there, this is the hard part.", "You're doing the right thing by trying again."]
const OPEN_PROGRESS_ERROR = ["Good, that error's gone.", 'Nice, it runs now.', "Great, no more error."]
const SOLUTION = "If you'd like, open the solution, read it line by line, then close it and type it yourself. That's a real way to learn it, not cheating."

/** What to say after a run that did not pass. Null when it passed: a right answer needs no comment. */
export function tutorLine(input: TutorInput): TutorLine | null {
  const { run } = input
  const total = run.results.length
  const passing = run.results.filter((r) => r.status === 'pass').length
  const failed = run.results.find((r) => r.status === 'fail')
  const errored = !!(run.error || /Traceback|error:/.test(run.stderr))
  if (!failed && !errored && total > 0) return null

  const trimmed = (s: string) => s.replace(/\s+/g, ' ').trim()
  const terminal = input.lang === 'bash' || input.lang === 'git'
  let d: Diagnosis | null = null
  if (terminal && !input.code.trim())
    d = { kind: 'unchanged', key: 'unchanged', say: "Nothing has been typed into the terminal yet.", more: `The task: ${sentence(firstSentence(input.task))}`, now: true }
  else if (!terminal && input.starter.trim() && trimmed(input.code) === trimmed(input.starter))
    d = { kind: 'unchanged', key: 'unchanged', say: "The code hasn't changed from how it started yet.", more: `The task: ${sentence(firstSentence(input.task))}` }
  const repeat = !d && !!input.before && trimmed(input.before.code) === trimmed(input.code)
  if (terminal && !d) d = shellDiagnosis({ starter: input.starter, solution: input.solution, checks: input.checks ?? [] }, input.code.split('\n'))
  d ??= errorDiagnosis(input)
  d ??= failed ? checkDiagnosis(failed, input.checks?.[run.results.indexOf(failed)], input) : { kind: 'check', key: 'unknown', say: "It didn't pass yet." }

  const before = input.before
  const seed = `${d.key}|${input.attempt}`
  const parts: string[] = []

  // How it opens: first try, trying again, or a real struggle; and any progress since last time.
  let opener: string
  if (before && (before.kind === 'error' || before.kind === 'timeout') && d.kind !== 'error' && d.kind !== 'timeout')
    opener = `${pick(OPEN_PROGRESS_ERROR, seed)} Now`
  else if (before && passing > before.passing && total > 1)
    opener = `That's closer: ${passing} of ${total} checks pass now. Next,`
  else if (input.attempt >= 4) opener = pick(OPEN_HARD, seed)
  else if (input.attempt >= 2) opener = pick(OPEN_AGAIN, seed)
  // "Nice try, but … , but …" trips over itself: when the line has its own "but", open without one.
  else opener = pick(/\bbut\b/.test(d.say) ? OPEN_FIRST.filter((o) => !/, but$/.test(o)) : OPEN_FIRST, seed)
  if (input.name && (input.attempt === 1 || input.attempt % 3 === 0)) {
    if (/, but$/.test(opener)) opener = opener.replace(/, but$/, `, ${input.name}, but`)
    else if (/:$/.test(opener)) opener = opener.replace(/:$/, `, ${input.name}:`)
    else if (/[.!]$/.test(opener) && !/ Now$|Next,$/.test(opener)) opener = opener.replace(/([.!])$/, `, ${input.name}$1`)
  }

  if (repeat) opener = "That's the same code as last time, so it does the same thing."
  if (/(but|Now|Next,|:)$/.test(opener)) parts.push(`${opener} ${lowerFirst(d.say)}`)
  else parts.push(opener, d.say)

  {
    // From the second try on, say what should be there, not only where.
    const again = before?.key === d.key
    if (d.more && (input.attempt >= 2 || again || repeat || d.now || d.kind === 'empty' || d.kind === 'unchanged')) parts.push(d.more)
    // Further on, the lesson's own hints, one at a time, then what the solution uses.
    const hintAt = input.attempt - 3
    const unsaid = (h: string) => !input.said.some((s) => s.includes(h.slice(0, 40)))
    if (hintAt >= 0) {
      const hint = input.hints[hintAt]
      if (hint && unsaid(hint)) parts.push(`Here's a hint: ${sentence(hint)}`)
      else if (hintAt >= input.hints.length) {
        const c = missingConstruct(input)
        if (c && unsaid(c)) parts.push(`One more thing I notice: the answer I have in mind uses ${c}, and yours doesn't yet.`)
      }
    }
    if (input.attempt >= 5 && !input.said.some((s) => s.includes('open the solution'))) parts.push(SOLUTION)
  }

  let text = parts.map(sentence).join(' ')
  // Never exactly the same words twice in a row.
  if (input.said.length && input.said[input.said.length - 1] === text) {
    const c = missingConstruct(input)
    text += c ? ` Maybe think about ${c}.` : ' Take it one line at a time, reading each one out loud to yourself.'
  }
  return { text, memory: { code: input.code, kind: d.kind, key: d.key, passing } }
}

function firstSentence(md: string): string {
  const plain = md.replace(/```[\s\S]*?```/g, '').replace(/[*_#>]/g, '').replace(/\s+/g, ' ').trim()
  const m = plain.match(/^(.{10,200}?[.!?])(\s|$)/)
  return clip(m ? m[1]! : plain, 200)
}
