/* ============================================================================
   awk for the practice terminal
   ----------------------------------------------------------------------------
   A POSIX awk: patterns and actions, BEGIN/END, ranges (p1,p2), fields and
   -F (a character, a string or a regular expression), NR NF FNR FS OFS ORS
   RS SUBSEP FILENAME RSTART RLENGTH CONVFMT OFMT ENVIRON ARGV, variables
   and associative arrays (with `in`, `delete`, (i,j) subscripts), string
   and number semantics (numeric-looking input compares as numbers), print
   and printf (> >> | redirection, /dev/stderr), getline, user functions,
   if/while/do/for/for-in, next, exit, and the built-in functions length
   substr index split sub gsub match sprintf tolower toupper int sqrt exp
   log sin cos atan2 rand srand system close.
   ========================================================================== */

import { fmtFloat, fmtInt, fmtStr, fmtUnsigned, parseFormat } from './shellPrintf'
import type { ToolIO, ToolResult } from './shellTools'

/* ── Values ──────────────────────────────────────────────────────────────── */

/** Input text that may count as a number ("strnum"): fields, getline, -v values. */
interface SN {
  sn: string
}
type V = number | string | SN | undefined

const NUMERIC = /^[ \t\n]*[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?[ \t\n]*$/
const NUM_PREFIX = /^[ \t\n]*[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/

function strToNum(s: string): number {
  const m = NUM_PREFIX.exec(s)
  if (m) return Number(m[0].trim())
  const t = s.trim().toLowerCase()
  if (/^[-+]?(inf|infinity)$/.test(t)) return t.startsWith('-') ? -Infinity : Infinity
  if (/^[-+]?nan$/.test(t)) return NaN
  return 0
}

const toNum = (v: V): number => (v === undefined ? 0 : typeof v === 'number' ? v : typeof v === 'string' ? strToNum(v) : strToNum(v.sn))

/** A number as awk writes it: integers plainly, others through CONVFMT/OFMT (%.6g). */
function numToStr(n: number, fmt: string): string {
  if (Number.isInteger(n) && Math.abs(n) < 2 ** 63) return BigInt(n).toString()
  if (Number.isNaN(n)) return n < 0 ? '-nan' : 'nan'
  if (!Number.isFinite(n)) return n < 0 ? '-inf' : 'inf'
  return sprintf(fmt, [n])
}

/* ── Lexer ───────────────────────────────────────────────────────────────── */

type Tok =
  | { k: 'num'; v: number }
  | { k: 'str'; v: string }
  | { k: 'ere'; v: string }
  | { k: 'name'; v: string }
  | { k: 'func'; v: string }
  | { k: 'builtin'; v: string }
  | { k: 'kw'; v: string }
  | { k: 'op'; v: string }
  | { k: 'nl' }
  | { k: 'eof' }

const KEYWORDS = ['BEGIN', 'END', 'function', 'func', 'if', 'else', 'while', 'for', 'do', 'break', 'continue', 'next', 'nextfile', 'exit', 'return', 'delete', 'in', 'getline', 'print', 'printf']
const BUILTINS = ['length', 'substr', 'index', 'split', 'sub', 'gsub', 'match', 'sprintf', 'sin', 'cos', 'atan2', 'exp', 'log', 'sqrt', 'int', 'rand', 'srand', 'tolower', 'toupper', 'system', 'close', 'fflush']
const OPS = ['+=', '-=', '*=', '/=', '%=', '^=', '**=', '==', '<=', '>=', '!=', '++', '--', '&&', '||', '>>', '!~', '**', '{', '}', '(', ')', '[', ']', ';', ',', '+', '-', '*', '/', '%', '^', '!', '>', '<', '|', '?', ':', '~', '$', '=']

class AwkError extends Error {}

function unescapeAwk(s: string): string {
  let out = ''
  for (let i = 0; i < s.length; i++) {
    const c = s[i]!
    if (c !== '\\' || i + 1 >= s.length) {
      out += c
      continue
    }
    const n = s[++i]!
    const map: Record<string, string> = { n: '\n', t: '\t', r: '\r', '\\': '\\', '"': '"', '/': '/', a: '\x07', b: '\b', f: '\f', v: '\v' }
    if (map[n] !== undefined) out += map[n]
    else if (/[0-7]/.test(n)) {
      const m = /^[0-7]{1,3}/.exec(s.slice(i))!
      out += String.fromCharCode(parseInt(m[0], 8))
      i += m[0].length - 1
    } else out += `\\${n}`
  }
  return out
}

function lex(src: string): Tok[] {
  const toks: Tok[] = []
  const operandEnd = () => {
    const t = toks[toks.length - 1]
    if (!t) return false
    if (t.k === 'num' || t.k === 'str' || t.k === 'ere' || t.k === 'name' || t.k === 'builtin') return true
    return t.k === 'op' && (t.v === ')' || t.v === ']' || t.v === '$' || t.v === '++' || t.v === '--')
  }
  let i = 0
  while (i < src.length) {
    const c = src[i]!
    if (c === ' ' || c === '\t' || c === '\r') {
      i++
      continue
    }
    if (c === '\\' && src[i + 1] === '\n') {
      i += 2
      continue
    }
    if (c === '\\' && src[i + 1] === '\r' && src[i + 2] === '\n') {
      i += 3
      continue
    }
    if (c === '#') {
      while (i < src.length && src[i] !== '\n') i++
      continue
    }
    if (c === '\n') {
      toks.push({ k: 'nl' })
      i++
      continue
    }
    if (c === '"') {
      let j = i + 1
      let raw = ''
      while (j < src.length && src[j] !== '"') {
        if (src[j] === '\\' && j + 1 < src.length) {
          raw += src[j]! + src[j + 1]!
          j += 2
          continue
        }
        if (src[j] === '\n') throw new AwkError('newline in string')
        raw += src[j]
        j++
      }
      if (j >= src.length) throw new AwkError('runaway string constant "' + raw.slice(0, 10) + ' ...')
      toks.push({ k: 'str', v: unescapeAwk(raw) })
      i = j + 1
      continue
    }
    if (c === '/' && !operandEnd()) {
      let j = i + 1
      let raw = ''
      let inBracket = false
      while (j < src.length) {
        const d = src[j]!
        if (d === '\n') throw new AwkError('runaway regular expression /' + raw.slice(0, 10) + ' ...')
        if (d === '\\' && j + 1 < src.length) {
          raw += src[j + 1] === '/' ? '/' : d + src[j + 1]!
          j += 2
          continue
        }
        if (d === '[' && !inBracket) {
          inBracket = true
          raw += d
          j++
          if (src[j] === '^') {
            raw += '^'
            j++
          }
          if (src[j] === ']') {
            raw += ']'
            j++
          }
          continue
        }
        if (d === ']' && inBracket) inBracket = false
        if (d === '/' && !inBracket) break
        raw += d
        j++
      }
      if (j >= src.length) throw new AwkError('runaway regular expression /' + raw.slice(0, 10) + ' ...')
      toks.push({ k: 'ere', v: raw })
      i = j + 1
      continue
    }
    const num = /^(?:0[xX][0-9a-fA-F]+|(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)/.exec(src.slice(i))
    if (num && /[\d.]/.test(c)) {
      toks.push({ k: 'num', v: /^0[xX]/.test(num[0]) ? parseInt(num[0], 16) : Number(num[0]) })
      i += num[0].length
      continue
    }
    const id = /^[A-Za-z_]\w*/.exec(src.slice(i))
    if (id) {
      const w = id[0]
      i += w.length
      if (KEYWORDS.includes(w)) toks.push({ k: 'kw', v: w === 'func' ? 'function' : w })
      else if (BUILTINS.includes(w)) toks.push({ k: 'builtin', v: w })
      else if (src[i] === '(') toks.push({ k: 'func', v: w })
      else toks.push({ k: 'name', v: w })
      continue
    }
    const op = OPS.find((o) => src.startsWith(o, i))
    if (!op) throw new AwkError(`syntax error at source line 1: unexpected character '${c}'`)
    toks.push({ k: 'op', v: op === '**' ? '^' : op === '**=' ? '^=' : op })
    i += op.length
  }
  toks.push({ k: 'eof' })
  return toks
}

/* ── Parser ──────────────────────────────────────────────────────────────── */

type LExpr = { t: 'var'; name: string } | { t: 'field'; e: Expr } | { t: 'idx'; name: string; subs: Expr[] }
type Expr =
  | LExpr
  | { t: 'num'; v: number }
  | { t: 'str'; v: string }
  | { t: 're'; src: string }
  | { t: 'in'; subs: Expr[]; name: string }
  | { t: 'assign'; op: string; target: LExpr; e: Expr }
  | { t: 'cond'; c: Expr; a: Expr; b: Expr }
  | { t: 'or' | 'and'; a: Expr; b: Expr }
  | { t: 'match'; neg: boolean; a: Expr; re: Expr }
  | { t: 'cmp'; op: string; a: Expr; b: Expr }
  | { t: 'cat'; a: Expr; b: Expr }
  | { t: 'bin'; op: string; a: Expr; b: Expr }
  | { t: 'un'; op: string; e: Expr }
  | { t: 'incdec'; op: '++' | '--'; pre: boolean; target: LExpr }
  | { t: 'call'; name: string; args: Expr[] }
  | { t: 'builtin'; name: string; args: Expr[] }
  | { t: 'getline'; from: 'plain' | 'file' | 'cmd'; target?: LExpr; e?: Expr }
  | { t: 'group'; items: Expr[] }

type Redirect = { op: '>' | '>>' | '|'; e: Expr }
type Stmt =
  | { t: 'expr'; e: Expr }
  | { t: 'print' | 'printf'; args: Expr[]; redir?: Redirect }
  | { t: 'if'; c: Expr; a: Stmt; b?: Stmt }
  | { t: 'while'; c: Expr; body: Stmt }
  | { t: 'do'; body: Stmt; c: Expr }
  | { t: 'for'; init?: Stmt; c?: Expr; step?: Stmt; body: Stmt }
  | { t: 'forin'; v: LExpr; arr: string; body: Stmt }
  | { t: 'block'; body: Stmt[] }
  | { t: 'next' | 'nextfile' | 'break' | 'continue' }
  | { t: 'exit' | 'return'; e?: Expr }
  | { t: 'delete'; name: string; subs?: Expr[] }

interface Rule {
  kind: 'begin' | 'end' | 'main'
  pattern?: Expr
  range?: [Expr, Expr]
  action?: Stmt[]
}
interface Func {
  params: string[]
  body: Stmt[]
}
interface Program {
  rules: Rule[]
  funcs: Record<string, Func>
}

function parseProgram(src: string): Program {
  const toks = lex(src)
  let i = 0
  const peek = (n = 0) => toks[Math.min(i + n, toks.length - 1)]!
  const isOp = (v: string, t: Tok = peek()) => t.k === 'op' && t.v === v
  const isKw = (v: string, t: Tok = peek()) => t.k === 'kw' && t.v === v
  const desc = (t: Tok) => (t.k === 'eof' ? 'end of file' : t.k === 'nl' ? 'newline' : String(t.v))
  const fail = (): never => {
    throw new AwkError(`syntax error at or near ${desc(peek())}`)
  }
  const expectOp = (v: string) => {
    if (!isOp(v)) fail()
    i++
  }
  const optNl = () => {
    while (peek().k === 'nl') i++
  }
  const skipTerms = () => {
    while (peek().k === 'nl' || isOp(';')) i++
  }
  let noGt = 0
  let noIn = 0

  const lvalue = (e: Expr): e is LExpr => e.t === 'var' || e.t === 'field' || e.t === 'idx'

  function primary(): Expr {
    const t = peek()
    switch (t.k) {
      case 'num':
        i++
        return { t: 'num', v: t.v }
      case 'str':
        i++
        return { t: 'str', v: t.v }
      case 'ere':
        i++
        return { t: 're', src: t.v }
      case 'func': {
        i++
        expectOp('(')
        const args = argList()
        return { t: 'call', name: t.v, args }
      }
      case 'builtin': {
        i++
        if (isOp('(')) {
          i++
          return { t: 'builtin', name: t.v, args: argList() }
        }
        if (t.v === 'length') return { t: 'builtin', name: 'length', args: [] }
        return fail()
      }
      case 'name': {
        i++
        if (isOp('[')) {
          i++
          const subs = exprList(']')
          return { t: 'idx', name: t.v, subs }
        }
        return { t: 'var', name: t.v }
      }
      case 'kw':
        if (t.v === 'getline') {
          i++
          const target = lvalueAhead()
          if (isOp('<')) {
            i++
            return { t: 'getline', from: 'file', ...(target ? { target } : {}), e: primaryNoCat() }
          }
          return { t: 'getline', from: 'plain', ...(target ? { target } : {}) }
        }
        return fail()
      case 'op':
        if (t.v === '$') {
          i++
          return { t: 'field', e: incdecOnly() }
        }
        if (t.v === '(') {
          i++
          noGt++
          const saveIn = noIn
          noIn = 0
          const items = [expr()]
          while (isOp(',')) {
            i++
            optNl()
            items.push(expr())
          }
          noIn = saveIn
          noGt--
          expectOp(')')
          if (items.length > 1) {
            if (!isKw('in')) return { t: 'group', items }
            i++
            const name = peek()
            if (name.k !== 'name') fail()
            i++
            return { t: 'in', subs: items, name: (name as { v: string }).v }
          }
          return { t: 'group', items }
        }
        if (t.v === '-' || t.v === '+' || t.v === '!') {
          i++
          return { t: 'un', op: t.v, e: unary() }
        }
        if (t.v === '++' || t.v === '--') {
          i++
          const target = incdecOnly()
          if (!lvalue(target)) fail()
          return { t: 'incdec', op: t.v, pre: true, target: target as LExpr }
        }
        return fail()
      default:
        return fail()
    }
  }
  /** After getline: an optional variable to read into. */
  function lvalueAhead(): LExpr | undefined {
    const t = peek()
    if (t.k === 'name' || (t.k === 'op' && t.v === '$')) {
      const e = t.k === 'op' ? (i++, { t: 'field' as const, e: incdecOnly() }) : primary()
      return lvalue(e) ? e : undefined
    }
    return undefined
  }
  /** The operand of $ and of getline <: a primary with ++/-- but no concatenation. */
  function incdecOnly(): Expr {
    if (isOp('-') || isOp('+') || isOp('!')) {
      const op = (peek() as { v: string }).v
      i++
      return { t: 'un', op, e: incdecOnly() }
    }
    const e = primary()
    return postfix(e)
  }
  function primaryNoCat(): Expr {
    return postfix(primary())
  }
  function postfix(e: Expr): Expr {
    if ((isOp('++') || isOp('--')) && lvalue(e)) {
      const op = (peek() as { v: '++' | '--' }).v
      i++
      return { t: 'incdec', op, pre: false, target: e }
    }
    return e
  }
  function argList(): Expr[] {
    optNl()
    if (isOp(')')) {
      i++
      return []
    }
    const args = exprList(')')
    return args
  }
  function exprList(close: string): Expr[] {
    const items: Expr[] = []
    noGt++
    const saveIn = noIn
    noIn = 0
    for (;;) {
      optNl()
      items.push(expr())
      optNl()
      if (isOp(',')) {
        i++
        continue
      }
      break
    }
    noIn = saveIn
    noGt--
    expectOp(close)
    return items
  }
  function power(): Expr {
    const b = postfix(primary())
    if (isOp('^')) {
      i++
      const e = unaryPow()
      return { t: 'bin', op: '^', a: b, b: e }
    }
    return b
  }
  /** The right side of ^ may itself be negative: 2^-1. */
  function unaryPow(): Expr {
    if (isOp('-') || isOp('+') || isOp('!')) {
      const op = (peek() as { v: string }).v
      i++
      return { t: 'un', op, e: unaryPow() }
    }
    return power()
  }
  function unary(): Expr {
    if (isOp('-') || isOp('+') || isOp('!')) {
      const op = (peek() as { v: string }).v
      i++
      return { t: 'un', op, e: unary() }
    }
    return power()
  }
  function mul(): Expr {
    let e = unary()
    while (isOp('*') || isOp('/') || isOp('%')) {
      const op = (peek() as { v: string }).v
      i++
      e = { t: 'bin', op, a: e, b: unary() }
    }
    return e
  }
  function add(): Expr {
    let e = mul()
    while (isOp('+') || isOp('-')) {
      const op = (peek() as { v: string }).v
      i++
      e = { t: 'bin', op, a: e, b: mul() }
    }
    return e
  }
  const startsOperand = (t: Tok) =>
    t.k === 'num' || t.k === 'str' || t.k === 'ere' || t.k === 'name' || t.k === 'func' || t.k === 'builtin' || (t.k === 'op' && ['$', '(', '!', '-', '+', '++', '--'].includes(t.v)) || (t.k === 'kw' && t.v === 'getline')
  function concat(): Expr {
    let e = add()
    for (;;) {
      const t = peek()
      if (isOp('|') && isKw('getline', peek(1))) {
        i += 2
        const target = lvalueAhead()
        e = { t: 'getline', from: 'cmd', e, ...(target ? { target } : {}) }
        continue
      }
      if (!startsOperand(t) || (t.k === 'op' && (t.v === '-' || t.v === '+' || t.v === '!')) || (t.k === 'kw' && t.v === 'in')) break
      e = { t: 'cat', a: e, b: add() }
    }
    return e
  }
  function comparison(): Expr {
    const e = concat()
    const t = peek()
    if (t.k === 'op' && ['<', '<=', '!=', '==', '>=', '>'].includes(t.v) && !(t.v === '>' && noGt === 0 && inPrint)) {
      i++
      return { t: 'cmp', op: t.v, a: e, b: concat() }
    }
    return e
  }
  function matchE(): Expr {
    let e = comparison()
    while (isOp('~') || isOp('!~')) {
      const neg = isOp('!~')
      i++
      e = { t: 'match', neg, a: e, re: comparison() }
    }
    return e
  }
  function inE(): Expr {
    let e = matchE()
    while (isKw('in') && !noIn) {
      i++
      const name = peek()
      if (name.k !== 'name') fail()
      i++
      e = { t: 'in', subs: e.t === 'group' ? e.items : [e], name: (name as { v: string }).v }
    }
    return e
  }
  function andE(): Expr {
    let e = inE()
    while (isOp('&&')) {
      i++
      optNl()
      e = { t: 'and', a: e, b: inE() }
    }
    return e
  }
  function orE(): Expr {
    let e = andE()
    while (isOp('||')) {
      i++
      optNl()
      e = { t: 'or', a: e, b: andE() }
    }
    return e
  }
  function ternary(): Expr {
    const c = orE()
    if (!isOp('?')) return c
    i++
    optNl()
    const a = ternary()
    optNl()
    expectOp(':')
    optNl()
    const b = ternary()
    return { t: 'cond', c, a, b }
  }
  function expr(): Expr {
    const e = ternary()
    const t = peek()
    if (t.k === 'op' && ['=', '+=', '-=', '*=', '/=', '%=', '^='].includes(t.v)) {
      const target = e.t === 'group' && e.items.length === 1 ? e.items[0]! : e
      if (!lvalue(target)) fail()
      i++
      optNl()
      return { t: 'assign', op: t.v, target: target as LExpr, e: expr() }
    }
    return e
  }
  let inPrint = false
  function simpleStmt(): Stmt {
    const t = peek()
    if (isKw('print') || isKw('printf')) {
      i++
      inPrint = true
      let args: Expr[] = []
      const ends = () => peek().k === 'nl' || peek().k === 'eof' || isOp(';') || isOp('}') || isOp('>') || isOp('>>') || isOp('|')
      if (!ends()) {
        args.push(expr())
        while (isOp(',')) {
          i++
          optNl()
          args.push(expr())
        }
      }
      inPrint = false
      if (args.length === 1 && args[0]!.t === 'group') args = args[0].items
      let redir: Redirect | undefined
      if (isOp('>') || isOp('>>') || isOp('|')) {
        const op = (peek() as { v: '>' | '>>' | '|' }).v
        i++
        redir = { op, e: concat() }
      }
      return { t: (t as { v: 'print' | 'printf' }).v, args, ...(redir ? { redir } : {}) }
    }
    if (isKw('delete')) {
      i++
      const name = peek()
      if (name.k !== 'name') fail()
      i++
      if (isOp('[')) {
        i++
        return { t: 'delete', name: (name as { v: string }).v, subs: exprList(']') }
      }
      return { t: 'delete', name: (name as { v: string }).v }
    }
    return { t: 'expr', e: expr() }
  }
  function stmt(): Stmt {
    optNl()
    const t = peek()
    if (isOp('{')) {
      i++
      const body = stmts()
      expectOp('}')
      return { t: 'block', body }
    }
    if (isOp(';')) {
      i++
      return { t: 'block', body: [] }
    }
    if (t.k === 'kw') {
      switch (t.v) {
        case 'if': {
          i++
          expectOp('(')
          const c = expr()
          expectOp(')')
          const a = stmt()
          const save = i
          skipTerms()
          if (isKw('else')) {
            i++
            return { t: 'if', c, a, b: stmt() }
          }
          i = save
          return { t: 'if', c, a }
        }
        case 'while': {
          i++
          expectOp('(')
          const c = expr()
          expectOp(')')
          if (isOp(';')) {
            i++
            return { t: 'while', c, body: { t: 'block', body: [] } }
          }
          return { t: 'while', c, body: stmt() }
        }
        case 'do': {
          i++
          const body = stmt()
          skipTerms()
          if (!isKw('while')) fail()
          i++
          expectOp('(')
          const c = expr()
          expectOp(')')
          return { t: 'do', body, c }
        }
        case 'for': {
          i++
          expectOp('(')
          if (peek().k === 'name' && isKw('in', peek(1)) && peek(2).k === 'name' && isOp(')', peek(3))) {
            const v = { t: 'var' as const, name: (peek() as { v: string }).v }
            const arr = (peek(2) as { v: string }).v
            i += 4
            return { t: 'forin', v, arr, body: stmt() }
          }
          if (isOp('(') && peek(1).k === 'name' && isKw('in', peek(2)) && peek(3).k === 'name' && isOp(')', peek(4)) && isOp(')', peek(5))) {
            const v = { t: 'var' as const, name: (peek(1) as { v: string }).v }
            const arr = (peek(3) as { v: string }).v
            i += 6
            return { t: 'forin', v, arr, body: stmt() }
          }
          const init = isOp(';') ? undefined : simpleStmt()
          expectOp(';')
          optNl()
          const c = isOp(';') ? undefined : expr()
          expectOp(';')
          optNl()
          const step = isOp(')') ? undefined : simpleStmt()
          expectOp(')')
          if (isOp(';')) {
            i++
            return { t: 'for', ...(init ? { init } : {}), ...(c ? { c } : {}), ...(step ? { step } : {}), body: { t: 'block', body: [] } }
          }
          return { t: 'for', ...(init ? { init } : {}), ...(c ? { c } : {}), ...(step ? { step } : {}), body: stmt() }
        }
        case 'next':
        case 'nextfile':
        case 'break':
        case 'continue':
          i++
          endStmt()
          return { t: t.v }
        case 'exit':
        case 'return': {
          i++
          const e = peek().k === 'nl' || peek().k === 'eof' || isOp(';') || isOp('}') ? undefined : expr()
          endStmt()
          return { t: t.v, ...(e ? { e } : {}) }
        }
      }
    }
    const s = simpleStmt()
    endStmt()
    return s
  }
  function endStmt() {
    if (isOp(';') || peek().k === 'nl') {
      i++
      return
    }
    if (isOp('}') || peek().k === 'eof') return
    fail()
  }
  function stmts(): Stmt[] {
    const out: Stmt[] = []
    for (;;) {
      skipTerms()
      if (isOp('}') || peek().k === 'eof') return out
      out.push(stmt())
    }
  }
  function action(): Stmt[] {
    expectOp('{')
    const body = stmts()
    expectOp('}')
    return body
  }

  const prog: Program = { rules: [], funcs: {} }
  for (;;) {
    skipTerms()
    const t = peek()
    if (t.k === 'eof') break
    if (isKw('BEGIN') || isKw('END')) {
      i++
      optNl()
      prog.rules.push({ kind: (t as { v: string }).v === 'BEGIN' ? 'begin' : 'end', action: action() })
      continue
    }
    if (isKw('function')) {
      i++
      const name = peek()
      if (name.k !== 'name' && name.k !== 'func') fail()
      i++
      expectOp('(')
      const params: string[] = []
      while (!isOp(')')) {
        const p = peek()
        if (p.k !== 'name') fail()
        params.push((p as { v: string }).v)
        i++
        if (isOp(',')) {
          i++
          optNl()
        }
      }
      i++
      optNl()
      prog.funcs[(name as { v: string }).v] = { params, body: action() }
      continue
    }
    const rule: Rule = { kind: 'main' }
    if (!isOp('{')) {
      const p = expr()
      if (isOp(',')) {
        i++
        optNl()
        rule.range = [p, expr()]
      } else rule.pattern = p
    }
    if (isOp('{')) rule.action = action()
    prog.rules.push(rule)
  }
  return prog
}

/* ── printf ──────────────────────────────────────────────────────────────── */

function sprintf(fmt: string, args: V[], convfmt = '%.6g'): string {
  let out = ''
  let k = 0
  for (const p of parseFormat(fmt)) {
    if (typeof p === 'string') {
      out += p
      continue
    }
    const spec = { flags: p.flags, conv: p.conv, ...(p.width !== undefined ? { width: p.width } : {}), ...(p.prec !== undefined ? { prec: p.prec } : {}) }
    if (p.starW) {
      const w = Math.trunc(toNum(args[k++]))
      spec.width = Math.abs(w)
      if (w < 0) spec.flags += '-'
    }
    if (p.starP) spec.prec = Math.max(0, Math.trunc(toNum(args[k++])))
    const a = args[k++]
    switch (p.conv) {
      case 'c': {
        const isNum = typeof a === 'number'
        out += fmtStr(isNum ? String.fromCodePoint(Math.trunc(a) || 0) : toStrWith(a, convfmt), spec)
        break
      }
      case 's':
      case 'b':
      case 'q':
        out += fmtStr(toStrWith(a, convfmt), { ...spec, conv: 's' })
        break
      case 'd':
      case 'i':
        out += fmtInt(toNum(a), spec)
        break
      case 'o':
      case 'u':
      case 'x':
      case 'X':
        out += fmtUnsigned(toNum(a), spec)
        break
      default:
        out += fmtFloat(toNum(a), spec)
    }
  }
  return out
}

const toStrWith = (v: V, fmt: string): string => (v === undefined ? '' : typeof v === 'string' ? v : typeof v === 'number' ? numToStr(v, fmt) : v.sn)

/* ── Interpreter ─────────────────────────────────────────────────────────── */

class NextSig {}
class NextFileSig {}
class ExitSig {
  code: number
  constructor(code: number) {
    this.code = code
  }
}
class ReturnSig {
  v: V
  constructor(v: V) {
    this.v = v
  }
}
class BreakSig {}
class ContinueSig {}

type Arr = Map<string, V>
/** A function parameter bound to an array, or to a variable that may become one. */
interface ArrRef {
  arr?: Arr
  lazy?: () => Arr
}
/** A function's own variable: a value, or (for arrays) a reference. */
interface Local {
  v: V
  ref?: ArrRef
}

/** POSIX bracket classes and interval support, for JavaScript's regular expressions. */
function awkRegex(src: string, cache: Map<string, RegExp>): RegExp {
  let re = cache.get(src)
  if (re) return re
  const map: Record<string, string> = { digit: '0-9', alpha: 'a-zA-Z', alnum: 'a-zA-Z0-9', upper: 'A-Z', lower: 'a-z', space: ' \\t\\n\\r\\f\\v', blank: ' \\t', punct: '!-\\/:-@\\[-`{-~', xdigit: '0-9A-Fa-f', cntrl: '\\x00-\\x1f\\x7f', print: ' -~', graph: '!-~' }
  let js = ''
  for (let i = 0; i < src.length; i++) {
    const c = src[i]!
    if (c === '\\' && i + 1 < src.length) {
      const n = src[i + 1]!
      js += n === '/' ? '/' : n === '"' ? '"' : c + n
      i++
      continue
    }
    if (c === '[') {
      let j = i + 1
      let body = ''
      if (src[j] === '^') {
        body += '^'
        j++
      }
      if (src[j] === ']') {
        body += '\\]'
        j++
      }
      while (j < src.length && src[j] !== ']') {
        const cls = /^\[:(\w+):\]/.exec(src.slice(j))
        if (cls) {
          body += map[cls[1]!] ?? ''
          j += cls[0].length
          continue
        }
        if (src[j] === '\\' && j + 1 < src.length) {
          body += src[j]! + src[j + 1]!
          j += 2
          continue
        }
        body += src[j] === '[' ? '\\[' : src[j]
        j++
      }
      js += `[${body}]`
      i = j
      continue
    }
    js += c
  }
  try {
    re = new RegExp(js)
  } catch {
    throw new AwkError(`regular expression compile failed (${src})`)
  }
  cache.set(src, re)
  return re
}

export function runAwk(args: string[], io: ToolIO): ToolResult {
  let fs: string | null = null
  const assigns: [string, string][] = []
  const progFiles: string[] = []
  let k = 0
  for (; k < args.length; k++) {
    const a = args[k]!
    if (a === '--') {
      k++
      break
    }
    if (a === '-F') fs = args[++k] ?? ''
    else if (a.startsWith('-F')) fs = a.slice(2)
    else if (a === '-v') assigns.push(splitAssign(args[++k] ?? ''))
    else if (a.startsWith('-v')) assigns.push(splitAssign(a.slice(2)))
    else if (a === '-f') progFiles.push(args[++k] ?? '')
    else if (a.startsWith('-f')) progFiles.push(a.slice(2))
    else if (a === '--version' || a === '-W') return { out: 'mawk 1.3.4 (practice terminal)\n', err: '', code: 0 }
    else if (a.startsWith('-') && a !== '-') return { out: '', err: `awk: not an option: ${a}\n`, code: 2 }
    else break
  }
  let src: string
  let usedStdin = false
  if (progFiles.length) {
    const parts: string[] = []
    for (const f of progFiles) {
      if (f === '/dev/stdin' || f === '-') {
        parts.push(io.takeStdin())
        usedStdin = true
        continue
      }
      const t = io.readFile(f)
      if (typeof t !== 'string') return { out: '', err: `awk: couldn't open file ${f}\n`, code: 2 }
      parts.push(t)
    }
    src = parts.join('\n')
  } else {
    if (k >= args.length) return { out: '', err: "usage: awk [-F fs][-v var=value][prog | -f progfile][file ...]\n", code: 2 }
    src = args[k++]!
  }
  const operands = args.slice(k)
  let prog: Program
  try {
    prog = parseProgram(src)
  } catch (e) {
    return { out: '', err: `awk: line 1: ${(e as Error).message}\n`, code: 2 }
  }
  return new Awk(prog, io, fs, assigns, operands, usedStdin).run()
}

function splitAssign(a: string): [string, string] {
  const eq = a.indexOf('=')
  return eq < 0 ? [a, ''] : [a.slice(0, eq), unescapeAwk(a.slice(eq + 1))]
}

class Awk {
  prog: Program
  io: ToolIO
  operands: string[]
  usedStdin: boolean
  vars = new Map<string, V>()
  arrays = new Map<string, Arr>()
  frames: Map<string, Local>[] = []
  record = ''
  fields: string[] = []
  fieldsValid = true
  nf = 0
  out = ''
  err = ''
  reCache = new Map<string, RegExp>()
  files = new Map<string, true>()
  pipes = new Map<string, string>()
  cmdInput = new Map<string, string[]>()
  fileInput = new Map<string, string[]>()
  inRange: boolean[] = []
  /** The records still to read from the current input. */
  pending: string[] = []
  inputs: { name: string; text: string }[] = []
  steps = 0
  seed = 0

  constructor(prog: Program, io: ToolIO, fs: string | null, assigns: [string, string][], operands: string[], usedStdin: boolean) {
    this.prog = prog
    this.io = io
    this.operands = operands
    this.usedStdin = usedStdin
    const set = (n: string, v: V) => this.vars.set(n, v)
    set('FS', fs === null ? ' ' : fs === 't' ? '\t' : unescapeAwk(fs))
    set('OFS', ' ')
    set('ORS', '\n')
    set('RS', '\n')
    set('NR', 0)
    set('FNR', 0)
    set('SUBSEP', '\x1c')
    set('CONVFMT', '%.6g')
    set('OFMT', '%.6g')
    set('FILENAME', '')
    set('RSTART', 0)
    set('RLENGTH', -1)
    this.arrays.set('ENVIRON', new Map(Object.entries(io.env).map(([a, b]) => [a, { sn: b }])))
    this.arrays.set('ARGV', new Map([['0', 'awk'], ...operands.map((o, i): [string, V] => [String(i + 1), { sn: o }])]))
    set('ARGC', operands.length + 1)
    for (const [n, v] of assigns) set(n, { sn: v })
  }

  /* ── variables ── */

  local(name: string): Local | undefined {
    return this.frames[this.frames.length - 1]?.get(name)
  }
  getVar(name: string): V {
    const l = this.local(name)
    if (l) return l.v
    if (name === 'NF') return this.getNF()
    return this.vars.get(name)
  }
  setVar(name: string, v: V): void {
    const l = this.local(name)
    if (l) {
      l.v = v
      return
    }
    if (name === 'NF') {
      this.setNF(Math.trunc(toNum(v)))
      return
    }
    this.vars.set(name, v)
  }
  arr(name: string): Arr {
    const l = this.local(name)
    if (l) {
      l.ref ??= {}
      if (!l.ref.arr) l.ref.arr = l.ref.lazy ? l.ref.lazy() : new Map()
      return l.ref.arr
    }
    let a = this.arrays.get(name)
    if (!a) {
      a = new Map()
      this.arrays.set(name, a)
    }
    return a
  }
  str(v: V): string {
    return toStrWith(v, toStrWith(this.vars.get('CONVFMT'), '%.6g') || '%.6g')
  }
  outStr(v: V): string {
    return typeof v === 'number' ? numToStr(v, toStrWith(this.vars.get('OFMT'), '%.6g') || '%.6g') : this.str(v)
  }
  subscript(subs: Expr[]): string {
    return subs.map((s) => this.str(this.eval(s))).join(this.str(this.vars.get('SUBSEP')))
  }

  /* ── fields ── */

  setRecord(text: string): void {
    this.record = text
    this.fieldsValid = false
  }
  split(): void {
    if (this.fieldsValid) return
    this.fields = this.splitText(this.record, this.str(this.vars.get('FS')), this.str(this.vars.get('RS')) === '')
    this.nf = this.fields.length
    this.fieldsValid = true
  }
  splitText(text: string, fs: string, paragraph = false): string[] {
    if (text === '') return []
    if (fs === ' ') return text.split(/[ \t\n]+/).filter((x, i, all) => x !== '' || (i > 0 && i < all.length - 1))
    const parts = fs.length === 1 && fs !== '\\' ? text.split(paragraph ? new RegExp(`[${fs.replace(/[\]\\^-]/g, '\\$&')}\\n]`) : fs) : text.split(new RegExp(paragraph ? `(?:${awkRegex(fs, this.reCache).source})|\\n` : awkRegex(fs, this.reCache).source))
    return fs === '' ? [...text] : parts
  }
  getNF(): number {
    this.split()
    return this.nf
  }
  setNF(n: number): void {
    this.split()
    this.fields.length = Math.max(0, n)
    for (let i = 0; i < n; i++) this.fields[i] ??= ''
    this.nf = Math.max(0, n)
    this.rebuild()
  }
  rebuild(): void {
    this.record = this.fields.join(this.str(this.vars.get('OFS')))
  }
  getField(n: number): V {
    if (n < 0) throw new AwkError(`trying to access out of range field ${n}`)
    if (n === 0) return { sn: this.record }
    this.split()
    const f = this.fields[n - 1]
    return f === undefined ? undefined : { sn: f }
  }
  setField(n: number, v: V): void {
    if (n < 0) throw new AwkError(`trying to access out of range field ${n}`)
    if (n === 0) {
      this.setRecord(this.str(v))
      return
    }
    this.split()
    while (this.fields.length < n) this.fields.push('')
    this.fields[n - 1] = this.str(v)
    this.nf = this.fields.length
    this.rebuild()
  }

  /* ── expressions ── */

  truthy(v: V): boolean {
    if (v === undefined) return false
    if (typeof v === 'number') return v !== 0
    if (typeof v === 'string') return v !== ''
    return NUMERIC.test(v.sn) ? toNum(v) !== 0 : v.sn !== ''
  }
  isNumeric(v: V): boolean {
    return typeof v === 'number' || (typeof v === 'object' && NUMERIC.test(v.sn))
  }
  compare(a: V, b: V): number {
    const numA = a === undefined || this.isNumeric(a)
    const numB = b === undefined || this.isNumeric(b)
    if (numA && numB) {
      const x = toNum(a)
      const y = toNum(b)
      return x < y ? -1 : x > y ? 1 : 0
    }
    const x = this.str(a)
    const y = this.str(b)
    return x < y ? -1 : x > y ? 1 : 0
  }
  regexOf(e: Expr): RegExp {
    return awkRegex(e.t === 're' ? e.src : this.str(this.eval(e)), this.reCache)
  }
  get(target: LExpr): V {
    if (target.t === 'var') return this.getVar(target.name)
    if (target.t === 'field') return this.getField(Math.trunc(toNum(this.eval(target.e))))
    const a = this.arr(target.name)
    const key = this.subscript(target.subs)
    if (!a.has(key)) a.set(key, undefined)
    return a.get(key)
  }
  set(target: LExpr, v: V): V {
    if (target.t === 'var') this.setVar(target.name, v)
    else if (target.t === 'field') this.setField(Math.trunc(toNum(this.eval(target.e))), v)
    else this.arr(target.name).set(this.subscript(target.subs), v)
    return v
  }
  arith(op: string, x: number, y: number): number {
    switch (op) {
      case '+':
        return x + y
      case '-':
        return x - y
      case '*':
        return x * y
      case '/':
        if (y === 0) throw new AwkError('division by zero')
        return x / y
      case '%':
        if (y === 0) throw new AwkError('division by zero in %')
        return x % y
      default:
        return x ** y
    }
  }
  eval(e: Expr): V {
    if (++this.steps > 2_000_000) throw new AwkError('the program ran too long — the practice terminal stops it')
    switch (e.t) {
      case 'num':
        return e.v
      case 'str':
        return e.v
      case 're':
        return this.regexOf(e).test(this.record) ? 1 : 0
      case 'var':
      case 'field':
      case 'idx':
        return this.get(e)
      case 'group':
        return e.items.length === 1 ? this.eval(e.items[0]!) : e.items.map((x) => this.str(this.eval(x))).join(this.str(this.vars.get('SUBSEP')))
      case 'in':
        return this.arr(e.name).has(this.subscript(e.subs)) ? 1 : 0
      case 'assign': {
        if (e.op === '=') {
          const v = this.eval(e.e)
          return this.set(e.target, typeof v === 'object' ? { sn: v.sn } : v)
        }
        const r = toNum(this.eval(e.e))
        return this.set(e.target, this.arith(e.op[0]!, toNum(this.get(e.target)), r))
      }
      case 'cond':
        return this.truthy(this.eval(e.c)) ? this.eval(e.a) : this.eval(e.b)
      case 'and':
        return this.truthy(this.eval(e.a)) && this.truthy(this.eval(e.b)) ? 1 : 0
      case 'or':
        return this.truthy(this.eval(e.a)) || this.truthy(this.eval(e.b)) ? 1 : 0
      case 'match': {
        const hit = this.regexOf(e.re).test(this.str(this.eval(e.a)))
        return hit !== e.neg ? 1 : 0
      }
      case 'cmp': {
        const c = this.compare(this.eval(e.a), this.eval(e.b))
        const r = e.op === '<' ? c < 0 : e.op === '<=' ? c <= 0 : e.op === '>' ? c > 0 : e.op === '>=' ? c >= 0 : e.op === '==' ? c === 0 : c !== 0
        return r ? 1 : 0
      }
      case 'cat':
        return this.str(this.eval(e.a)) + this.str(this.eval(e.b))
      case 'bin':
        return this.arith(e.op, toNum(this.eval(e.a)), toNum(this.eval(e.b)))
      case 'un': {
        const v = this.eval(e.e)
        return e.op === '!' ? (this.truthy(v) ? 0 : 1) : e.op === '-' ? -toNum(v) : toNum(v)
      }
      case 'incdec': {
        const old = toNum(this.get(e.target))
        const nv = old + (e.op === '++' ? 1 : -1)
        this.set(e.target, nv)
        return e.pre ? nv : old
      }
      case 'call':
        return this.call(e.name, e.args)
      case 'builtin':
        return this.builtin(e.name, e.args)
      case 'getline':
        return this.getline(e)
    }
  }

  call(name: string, args: Expr[]): V {
    const fn = this.prog.funcs[name]
    if (!fn) throw new AwkError(`function ${name} never defined`)
    if (this.frames.length > 500) throw new AwkError('function call nesting too deep')
    const frame = new Map<string, Local>()
    fn.params.forEach((p, i) => {
      const a = args[i]
      if (!a) {
        frame.set(p, { v: undefined })
        return
      }
      if (a.t === 'var') {
        const l = this.local(a.name)
        if (l?.ref) {
          frame.set(p, { v: undefined, ref: l.ref })
          return
        }
        if (!l && this.arrays.has(a.name)) {
          frame.set(p, { v: undefined, ref: { arr: this.arrays.get(a.name)! } })
          return
        }
        if (this.getVar(a.name) === undefined) {
          // Not set yet: it becomes an array (in the caller too) if the function uses it as one.
          const outer = l
          frame.set(p, {
            v: undefined,
            ref: {
              lazy: () => {
                const made = new Map<string, V>()
                if (outer) outer.ref = { arr: made }
                else this.arrays.set(a.name, made)
                return made
              },
            },
          })
          return
        }
      }
      frame.set(p, { v: this.eval(a) })
    })
    this.frames.push(frame)
    try {
      this.execAll(fn.body)
    } catch (sig) {
      if (sig instanceof ReturnSig) return sig.v
      throw sig
    } finally {
      this.frames.pop()
    }
    return undefined
  }

  builtin(name: string, args: Expr[]): V {
    const s = (i: number) => this.str(this.eval(args[i]!))
    const n = (i: number) => toNum(this.eval(args[i]!))
    switch (name) {
      case 'length': {
        if (!args.length) return [...this.record].length
        const a = args[0]!
        if (a.t === 'var') {
          const l = this.local(a.name)
          if (l?.ref?.arr || (!l && this.arrays.has(a.name))) return this.arr(a.name).size
        }
        return [...s(0)].length
      }
      case 'substr': {
        const str = [...s(0)]
        const m = n(1)
        const len = args.length > 2 ? n(2) : Infinity
        // POSIX: characters from position m (rounded) for len characters; positions before 1 are cut.
        const start = Math.round(m)
        const end = len === Infinity ? Infinity : start + Math.round(len)
        const from = Math.max(start, 1)
        const to = Math.min(end, str.length + 1)
        return to > from ? str.slice(from - 1, to - 1).join('') : ''
      }
      case 'index': {
        const i = s(0).indexOf(s(1))
        return i < 0 ? 0 : [...s(0).slice(0, i)].length + 1
      }
      case 'split': {
        const text = s(0)
        const target = args[1]
        if (!target || target.t !== 'var') throw new AwkError('split: second argument must be an array')
        const fsE = args[2]
        const parts = fsE ? (fsE.t === 're' ? (text === '' ? [] : text.split(awkRegex(fsE.src, this.reCache))) : this.splitText(text, this.str(this.eval(fsE)))) : this.splitText(text, this.str(this.vars.get('FS')))
        const a = this.arr(target.name)
        a.clear()
        parts.forEach((p, i) => a.set(String(i + 1), { sn: p }))
        return parts.length
      }
      case 'sub':
      case 'gsub': {
        const re = this.regexOf(args[0]!)
        const repl = s(1)
        const target: LExpr = args[2] && (args[2].t === 'var' || args[2].t === 'field' || args[2].t === 'idx') ? args[2] : { t: 'field', e: { t: 'num', v: 0 } }
        const text = this.str(this.get(target))
        let count = 0
        const g = new RegExp(re.source, name === 'gsub' ? 'g' : '')
        const res = text.replace(g, (m) => {
          count++
          let out = ''
          for (let i = 0; i < repl.length; i++) {
            const c = repl[i]!
            if (c === '\\' && (repl[i + 1] === '&' || repl[i + 1] === '\\')) {
              out += repl[++i]
              continue
            }
            out += c === '&' ? m : c
          }
          return out
        })
        if (count) this.set(target, res)
        return count
      }
      case 'match': {
        const text = s(0)
        const m = this.regexOf(args[1]!).exec(text)
        const start = m ? [...text.slice(0, m.index)].length + 1 : 0
        const len = m ? [...m[0]].length : -1
        this.vars.set('RSTART', start)
        this.vars.set('RLENGTH', len)
        if (args[2]?.t === 'var' && m) {
          const a = this.arr(args[2].name)
          a.clear()
          m.forEach((g, i) => a.set(String(i), g ?? ''))
        }
        return start
      }
      case 'sprintf':
        return args.length ? sprintf(s(0), args.slice(1).map((a) => this.eval(a)), this.str(this.vars.get('CONVFMT'))) : ''
      case 'sin':
        return Math.sin(n(0))
      case 'cos':
        return Math.cos(n(0))
      case 'atan2':
        return Math.atan2(n(0), n(1))
      case 'exp':
        return Math.exp(n(0))
      case 'log':
        return Math.log(n(0))
      case 'sqrt':
        return Math.sqrt(n(0))
      case 'int':
        return Math.trunc(n(0))
      case 'rand': {
        this.seed = (this.seed * 1103515245 + 12345) % 2147483648
        return this.seed / 2147483648
      }
      case 'srand': {
        const old = this.seed
        this.seed = args.length ? Math.trunc(n(0)) : 0
        return old
      }
      case 'tolower':
        return s(0).toLowerCase()
      case 'toupper':
        return s(0).toUpperCase()
      case 'system': {
        this.flushPipes()
        const r = this.io.run(s(0), '')
        this.out += r.out
        this.err += r.err
        return r.code
      }
      case 'close': {
        const key = s(0)
        if (this.pipes.has(key)) {
          this.flushPipe(key)
          return 0
        }
        this.cmdInput.delete(key)
        this.fileInput.delete(key)
        this.files.delete(key)
        return 0
      }
      case 'fflush':
        return 0
    }
    throw new AwkError(`unknown function ${name}`)
  }

  getline(e: Extract<Expr, { t: 'getline' }>): V {
    let line: string | undefined
    if (e.from === 'plain') {
      line = this.nextRecord()
      if (line === undefined) return 0
      this.vars.set('NR', toNum(this.vars.get('NR')) + 1)
      this.vars.set('FNR', toNum(this.vars.get('FNR')) + 1)
    } else {
      const key = this.str(this.eval(e.e!))
      let lines = e.from === 'cmd' ? this.cmdInput.get(key) : this.fileInput.get(key)
      if (!lines) {
        let text: string
        if (e.from === 'cmd') {
          const r = this.io.run(key, '')
          this.err += r.err
          text = r.out
        } else {
          if (key === '-' || key === '/dev/stdin') text = this.io.takeStdin()
          else {
            const t = this.io.readFile(key)
            if (typeof t !== 'string') return -1
            text = t
          }
        }
        lines = this.records(text)
        ;(e.from === 'cmd' ? this.cmdInput : this.fileInput).set(key, lines)
      }
      line = lines.shift()
      if (line === undefined) return 0
      if (e.from === 'cmd') this.vars.set('NR', toNum(this.vars.get('NR')) + 1)
    }
    if (e.target) this.set(e.target, { sn: line })
    else this.setRecord(line)
    return 1
  }

  /** Splits input text into records by RS: a newline, another character, "" (paragraphs), or a regular expression. */
  records(text: string): string[] {
    const rs = this.str(this.vars.get('RS'))
    if (text === '') return []
    if (rs === '\n' || rs.length === 1) {
      const parts = text.split(rs)
      if (parts[parts.length - 1] === '') parts.pop()
      return parts
    }
    if (rs === '') return text.replace(/^\n+/, '').replace(/\n+$/, '').split(/\n\n+/)
    const parts = text.split(awkRegex(rs, this.reCache))
    if (parts[parts.length - 1] === '') parts.pop()
    return parts
  }

  /** The next record from the input files (or standard input), or undefined at the end. */
  nextRecord(): string | undefined {
    for (;;) {
      if (this.pending.length) return this.pending.shift()
      const next = this.inputs.shift()
      if (!next) return undefined
      this.vars.set('FILENAME', next.name)
      this.vars.set('FNR', 0)
      this.pending = this.records(next.text)
    }
  }

  /* ── statements ── */

  write(text: string, redir: Redirect | undefined): void {
    if (!redir) {
      this.out += text
      return
    }
    const target = this.str(this.eval(redir.e))
    if (redir.op === '|') {
      this.pipes.set(target, (this.pipes.get(target) ?? '') + text)
      return
    }
    if (target === '/dev/stderr' || target === '/dev/fd/2') {
      this.err += text
      return
    }
    if (target === '/dev/stdout' || target === '-' || target === '/dev/fd/1') {
      this.out += text
      return
    }
    const append = redir.op === '>>' || this.files.has(target)
    this.files.set(target, true)
    const err = this.io.writeFile(target, text, append)
    if (err) throw new AwkError(`cannot open "${target}" for output`)
  }
  flushPipe(cmd: string): void {
    const input = this.pipes.get(cmd) ?? ''
    this.pipes.delete(cmd)
    const r = this.io.run(cmd, input)
    this.out += r.out
    this.err += r.err
  }
  flushPipes(): void {
    for (const cmd of [...this.pipes.keys()]) this.flushPipe(cmd)
  }

  exec(s: Stmt): void {
    if (++this.steps > 2_000_000) throw new AwkError('the program ran too long — the practice terminal stops it')
    switch (s.t) {
      case 'expr':
        this.eval(s.e)
        return
      case 'print': {
        const ofs = this.str(this.vars.get('OFS'))
        const ors = this.str(this.vars.get('ORS'))
        const text = s.args.length ? s.args.map((a) => this.outStr(this.eval(a))).join(ofs) : this.record
        this.write(text + ors, s.redir)
        return
      }
      case 'printf': {
        if (!s.args.length) throw new AwkError('printf: no format')
        const vals = s.args.map((a) => this.eval(a))
        this.write(sprintf(this.str(vals[0]), vals.slice(1), this.str(this.vars.get('CONVFMT'))), s.redir)
        return
      }
      case 'if':
        if (this.truthy(this.eval(s.c))) this.exec(s.a)
        else if (s.b) this.exec(s.b)
        return
      case 'while':
        while (this.truthy(this.eval(s.c))) if (this.loopBody(s.body)) break
        return
      case 'do':
        do {
          if (this.loopBody(s.body)) break
        } while (this.truthy(this.eval(s.c)))
        return
      case 'for':
        if (s.init) this.exec(s.init)
        while (!s.c || this.truthy(this.eval(s.c))) {
          if (this.loopBody(s.body)) break
          if (s.step) this.exec(s.step)
        }
        return
      case 'forin': {
        const a = this.arr(s.arr)
        for (const key of [...a.keys()]) {
          if (!a.has(key)) continue
          this.set(s.v, { sn: key })
          if (this.loopBody(s.body)) break
        }
        return
      }
      case 'block':
        this.execAll(s.body)
        return
      case 'next':
        throw new NextSig()
      case 'nextfile':
        throw new NextFileSig()
      case 'break':
        throw new BreakSig()
      case 'continue':
        throw new ContinueSig()
      case 'exit':
        throw new ExitSig(s.e ? Math.trunc(toNum(this.eval(s.e))) : -1)
      case 'return':
        throw new ReturnSig(s.e ? this.eval(s.e) : undefined)
      case 'delete':
        if (s.subs) this.arr(s.name).delete(this.subscript(s.subs))
        else this.arr(s.name).clear()
        return
    }
  }
  /** One pass of a loop body: true when it breaks. */
  loopBody(body: Stmt): boolean {
    try {
      this.exec(body)
    } catch (sig) {
      if (sig instanceof BreakSig) return true
      if (sig instanceof ContinueSig) return false
      throw sig
    }
    return false
  }
  execAll(body: Stmt[]): void {
    for (const s of body) this.exec(s)
  }

  /* ── the main loop ── */

  run(): ToolResult {
    let code = 0
    const rules = this.prog.rules
    const main = rules.filter((r) => r.kind === 'main')
    const needsInput = main.length > 0 || rules.some((r) => r.kind === 'end')
    let exited = false
    try {
      try {
        for (const r of rules) if (r.kind === 'begin') this.execAll(r.action!)
      } catch (sig) {
        if (!(sig instanceof ExitSig)) throw sig
        exited = true
        if (sig.code >= 0) code = sig.code
      }
      if (!exited && needsInput) {
        // Operands: files, - for standard input, and var=value assignments made when reached.
        const files: string[] = []
        for (let i = 1; i < toNum(this.vars.get('ARGC')); i++) {
          const a = this.str(this.arrays.get('ARGV')?.get(String(i)))
          if (a !== '') files.push(a)
        }
        const queue = files.length ? files : ['-']
        if (!files.length && this.io.stdin === null && !this.usedStdin) throw new AwkError('give it a file name, or pipe something into it (… | awk …)')
        try {
          for (const f of queue) {
            const asg = /^([A-Za-z_]\w*)=(.*)$/s.exec(f)
            if (asg) {
              this.vars.set(asg[1]!, { sn: unescapeAwk(asg[2]!) })
              continue
            }
            let text: string
            if (f === '-' || f === '/dev/stdin') text = this.io.takeStdin()
            else {
              const t = this.io.readFile(f)
              if (typeof t !== 'string') {
                this.err += `awk: cannot open ${f} (${t.error})\n`
                code = 2
                continue
              }
              text = t
            }
            this.inputs = [{ name: f === '-' ? '' : f, text }]
            this.pending = []
            try {
              for (let line = this.nextRecord(); line !== undefined; line = this.nextRecord()) {
                this.vars.set('NR', toNum(this.vars.get('NR')) + 1)
                this.vars.set('FNR', toNum(this.vars.get('FNR')) + 1)
                this.setRecord(line)
                try {
                  this.runMain(main)
                } catch (sig) {
                  if (!(sig instanceof NextSig)) throw sig
                }
              }
            } catch (sig) {
              if (!(sig instanceof NextFileSig)) throw sig
            }
          }
        } catch (sig) {
          if (!(sig instanceof ExitSig)) throw sig
          if (sig.code >= 0) code = sig.code
        }
      }
      try {
        for (const r of rules) if (r.kind === 'end') this.execAll(r.action!)
      } catch (sig) {
        if (!(sig instanceof ExitSig)) throw sig
        if (sig.code >= 0) code = sig.code
      }
    } catch (e) {
      if (e instanceof ExitSig) code = e.code >= 0 ? e.code : code
      else if (e instanceof AwkError) {
        this.flushPipes()
        return { out: this.out, err: `${this.err}awk: ${e.message}\n`, code: 2 }
      } else if (e instanceof NextSig || e instanceof NextFileSig) {
        this.err += 'awk: improper use of next\n'
        code = 2
      } else throw e
    }
    this.flushPipes()
    return { out: this.out, err: this.err, code }
  }

  runMain(main: Rule[]): void {
    main.forEach((r, idx) => {
      let hit: boolean
      if (r.range) {
        if (!this.inRange[idx]) {
          hit = this.truthy(this.eval(r.range[0]))
          if (hit && !this.truthy(this.eval(r.range[1]))) this.inRange[idx] = true
        } else {
          hit = true
          if (this.truthy(this.eval(r.range[1]))) this.inRange[idx] = false
        }
      } else hit = !r.pattern || this.truthy(this.eval(r.pattern))
      if (!hit) return
      if (r.action) this.execAll(r.action)
      else this.out += this.record + this.str(this.vars.get('ORS'))
    })
  }
}
