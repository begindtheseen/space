/* ============================================================================
   jq for the practice terminal
   ----------------------------------------------------------------------------
   The jq language as the lessons use it, behaving like jq 1.7: . .key .[n]
   .[] .[a:b] ? | , // literals, [ ] and { } construction, string
   interpolation, arithmetic and comparison, and/or/not, if/elif/else,
   `as $x`, reduce, foreach, try/catch, def, --arg/--argjson/$ENV, the
   update operators (= |= += …) and the common builtins: length keys has
   map select empty add min max sort_by group_by unique_by to_entries
   with_entries split join test sub gsub @csv @tsv @json @sh @base64 … with
   -r -c -n -s -e -S. Number literals print as written (519.0 stays 519.0).
   ========================================================================== */

import type { ToolIO, ToolResult } from './shellTools'

/* ── Values ──────────────────────────────────────────────────────────────── */

/** A number literal from the input, kept so it prints as it was written. */
class Lit {
  n: number
  text: string
  constructor(n: number, text: string) {
    this.n = n
    this.text = text
  }
}
type J = null | boolean | number | string | Lit | J[] | Map<string, J>

class JqError extends Error {
  value: J
  constructor(value: J) {
    super(typeof value === 'string' ? value : dump(value, true, 0))
    this.value = value
  }
}

const num = (v: J): number => (v instanceof Lit ? v.n : (v as number))
const isNum = (v: J): v is number | Lit => typeof v === 'number' || v instanceof Lit
const isObj = (v: J): v is Map<string, J> => v instanceof Map
const truthy = (v: J) => v !== null && v !== false

function typeOf(v: J): string {
  if (v === null) return 'null'
  if (typeof v === 'boolean') return 'boolean'
  if (isNum(v)) return 'number'
  if (typeof v === 'string') return 'string'
  if (Array.isArray(v)) return 'array'
  return 'object'
}

/** A value in error messages: type (value), the value cut to about 11 characters as jq does. */
function desc(v: J): string {
  let t = dump(v, true, 0)
  if (t.length > 11) t = `${t.slice(0, 10)}...`
  return `${typeOf(v)} (${t})`
}

/** jq's number text: 17 significant digits at most, -0 kept, 1e+21 style exponents. */
function numText(n: number): string {
  if (Object.is(n, -0)) return '-0'
  if (Number.isNaN(n)) return 'null'
  if (!Number.isFinite(n)) return n > 0 ? '1.7976931348623157e+308' : '-1.7976931348623157e+308'
  return String(n)
}

/** A literal as jq 1.7 prints it: kept, but in decNumber's form (1e3 → 1E+3). */
function litText(text: string): string {
  const m = /^(-?)(\d*)(?:\.(\d*))?(?:[eE]([-+]?\d+))?$/.exec(text)
  if (!m) return text
  if (m[4] === undefined) return text
  const sign = m[1]!
  const intPart = m[2] ?? ''
  const frac = m[3] ?? ''
  let digits = (intPart + frac).replace(/^0+(?=\d)/, '')
  let exp = Number(m[4]) - frac.length
  if (/^0+$/.test(digits)) digits = '0'
  const adjusted = exp + digits.length - 1
  if (exp <= 0 && adjusted >= -6) {
    if (exp === 0) return sign + digits
    const point = digits.length + exp
    return sign + (point > 0 ? `${digits.slice(0, point)}.${digits.slice(point)}` : `0.${'0'.repeat(-point)}${digits}`)
  }
  const mant = digits.length > 1 ? `${digits[0]}.${digits.slice(1)}` : digits
  exp = adjusted
  return `${sign}${mant}E${exp < 0 ? '-' : '+'}${Math.abs(exp)}`
}

function strJson(s: string): string {
  let out = '"'
  for (const ch of s) {
    const c = ch.codePointAt(0)!
    if (ch === '"') out += '\\"'
    else if (ch === '\\') out += '\\\\'
    else if (ch === '\n') out += '\\n'
    else if (ch === '\t') out += '\\t'
    else if (ch === '\r') out += '\\r'
    else if (ch === '\b') out += '\\b'
    else if (ch === '\f') out += '\\f'
    else if (c < 0x20 || c === 0x7f) out += `\\u${c.toString(16).padStart(4, '0')}`
    else out += ch
  }
  return `${out}"`
}

/** JSON text: compact, or indented by `indent` spaces (a tab when indent is -1). */
function dump(v: J, compact: boolean, indent = 2, sortKeys = false, depth = 0): string {
  if (v === null) return 'null'
  if (typeof v === 'boolean') return String(v)
  if (typeof v === 'number') return numText(v)
  if (v instanceof Lit) return litText(v.text)
  if (typeof v === 'string') return strJson(v)
  const pad = (d: number) => (indent < 0 ? '\t'.repeat(d) : ' '.repeat(indent * d))
  if (Array.isArray(v)) {
    if (!v.length) return '[]'
    if (compact) return `[${v.map((x) => dump(x, true, indent, sortKeys)).join(',')}]`
    return `[\n${v.map((x) => pad(depth + 1) + dump(x, false, indent, sortKeys, depth + 1)).join(',\n')}\n${pad(depth)}]`
  }
  let keys = [...v.keys()]
  if (sortKeys) keys = keys.sort(cmpStr)
  if (!keys.length) return '{}'
  if (compact) return `{${keys.map((k) => `${strJson(k)}:${dump(v.get(k)!, true, indent, sortKeys)}`).join(',')}}`
  return `{\n${keys.map((k) => `${pad(depth + 1)}${strJson(k)}: ${dump(v.get(k)!, false, indent, sortKeys, depth + 1)}`).join(',\n')}\n${pad(depth)}}`
}

const cmpStr = (a: string, b: string) => {
  // By code point, as jq compares strings.
  const x = [...a]
  const y = [...b]
  for (let i = 0; i < Math.min(x.length, y.length); i++) {
    const d = x[i]!.codePointAt(0)! - y[i]!.codePointAt(0)!
    if (d) return d
  }
  return x.length - y.length
}

const ORDER = ['null', 'boolean', 'number', 'string', 'array', 'object']

/** jq's ordering: null < false < true < numbers < strings < arrays < objects. */
function compare(a: J, b: J): number {
  const ta = typeOf(a)
  const tb = typeOf(b)
  if (ta !== tb) return ORDER.indexOf(ta) - ORDER.indexOf(tb)
  switch (ta) {
    case 'null':
      return 0
    case 'boolean':
      return Number(a) - Number(b)
    case 'number':
      return num(a) < num(b) ? -1 : num(a) > num(b) ? 1 : 0
    case 'string':
      return cmpStr(a as string, b as string)
    case 'array': {
      const x = a as J[]
      const y = b as J[]
      for (let i = 0; i < Math.min(x.length, y.length); i++) {
        const c = compare(x[i]!, y[i]!)
        if (c) return c
      }
      return x.length - y.length
    }
    default: {
      const x = a as Map<string, J>
      const y = b as Map<string, J>
      const kx = [...x.keys()].sort(cmpStr)
      const ky = [...y.keys()].sort(cmpStr)
      const c = compare(kx, ky)
      if (c) return c
      for (const k of kx) {
        const d = compare(x.get(k)!, y.get(k)!)
        if (d) return d
      }
      return 0
    }
  }
}

const equal = (a: J, b: J) => compare(a, b) === 0

/* ── JSON input ──────────────────────────────────────────────────────────── */

/** Every JSON value in a text (jq reads one after another). */
function parseJsonStream(text: string): { values: J[]; lines: number[]; error?: string } {
  let i = 0
  const values: J[] = []
  const lines: number[] = []
  const lineCol = () => {
    const before = text.slice(0, Math.min(i, text.length))
    const line = before.split('\n').length
    const col = i - (before.lastIndexOf('\n') + 1)
    return `line ${line}, column ${col}`
  }
  const fail = (msg: string): never => {
    throw new Error(`${msg}${i >= text.length ? ' at EOF' : ''} at ${lineCol()}`)
  }
  /** jq notices a bad token only once it has read the character after it. */
  const failAfterToken = (msg: string): never => {
    const m = /^[^\s,:\]}[{"]+/.exec(text.slice(i))
    if (m) i += m[0].length
    const atEof = i >= text.length
    if (!atEof) i++
    throw new Error(`${msg}${atEof ? ' at EOF' : ''} at ${lineCol()}`)
  }
  const ws = () => {
    while (i < text.length && ' \t\n\r'.includes(text[i]!)) i++
  }
  const value = (): J => {
    ws()
    const c = text[i]
    if (c === '{') {
      i++
      const m = new Map<string, J>()
      ws()
      if (text[i] === '}') {
        i++
        return m
      }
      for (;;) {
        ws()
        if (i >= text.length) fail('Unfinished JSON term')
        if (text[i] !== '"') {
          const w = /^[^\s,:\]}[{"]+/.exec(text.slice(i))?.[0] ?? ''
          if (w && !/^(null|true|false|nan|-?\d[\d.eE+-]*)$/.test(w)) failAfterToken('Invalid numeric literal')
          failAfterToken('Object keys must be strings')
        }
        const k = str()
        ws()
        if (i >= text.length) fail('Unfinished JSON term')
        if (text[i] !== ':') failAfterToken(/^[^\s,:\]}[{"]/.test(text[i]!) ? 'Expected separator between values' : "Objects must consist of key:value pairs")
        i++
        m.set(k, value())
        ws()
        if (text[i] === ',') {
          i++
          continue
        }
        if (text[i] === '}') {
          i++
          return m
        }
        if (i >= text.length) fail('Unfinished JSON term')
        failAfterToken('Expected separator between values')
      }
    }
    if (c === '[') {
      i++
      const a: J[] = []
      ws()
      if (text[i] === ']') {
        i++
        return a
      }
      for (;;) {
        a.push(value())
        ws()
        if (text[i] === ',') {
          i++
          continue
        }
        if (text[i] === ']') {
          i++
          return a
        }
        if (i >= text.length) fail('Unfinished JSON term')
        failAfterToken('Expected separator between values')
      }
    }
    if (c === '"') return str()
    const m = /^[^\s,:\]}[{"]+/.exec(text.slice(i))
    if (!m) return i >= text.length ? fail('Unfinished JSON term') : failAfterToken('Invalid literal')
    const word = m[0]
    const known: Record<string, J> = { null: null, true: true, false: false, nan: NaN, NaN: NaN }
    if (word in known) {
      i += word.length
      return known[word]!
    }
    if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][-+]?\d+)?$/.test(word)) {
      i += word.length
      const n = Number(word)
      return String(n) === word ? n : new Lit(n, word)
    }
    return failAfterToken('Invalid numeric literal')
  }
  const str = (): string => {
    i++
    let out = ''
    while (i < text.length && text[i] !== '"') {
      const c = text[i]!
      if (c === '\\') {
        const n = text[i + 1]
        const map: Record<string, string> = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', '/': '/', '\\': '\\', '"': '"' }
        if (n === 'u') {
          out += String.fromCharCode(parseInt(text.slice(i + 2, i + 6), 16))
          i += 6
          continue
        }
        if (n === undefined || map[n] === undefined) fail('Invalid escape')
        out += map[n!]
        i += 2
        continue
      }
      out += c
      i++
    }
    if (i >= text.length) fail('Unfinished string')
    i++
    return out
  }
  try {
    for (;;) {
      ws()
      if (i >= text.length) break
      values.push(value())
      lines.push(text.slice(0, i).split('\n').length)
    }
  } catch (e) {
    return { values, lines, error: (e as Error).message }
  }
  return { values, lines }
}

/* ── The jq language: lexer ──────────────────────────────────────────────── */

type StrPart = string | Ast
type Tok =
  | { k: 'num'; v: number; text: string }
  | { k: 'str'; parts: StrPart[] }
  | { k: 'field'; v: string }
  | { k: 'var'; v: string }
  | { k: 'ident'; v: string }
  | { k: 'format'; v: string }
  | { k: 'op'; v: string }
  | { k: 'eof' }

const JQ_OPS = ['?//', '|=', '+=', '-=', '*=', '/=', '%=', '//=', '==', '!=', '<=', '>=', '//', '..', '.', '[', ']', '{', '}', '(', ')', '|', ',', ':', ';', '=', '<', '>', '+', '-', '*', '/', '%', '?']
const KEYWORDS = ['def', 'if', 'then', 'elif', 'else', 'end', 'as', 'reduce', 'foreach', 'try', 'catch', 'label', 'import', 'include', 'and', 'or', '__loc__']

function lexJq(src: string): Tok[] {
  const toks: Tok[] = []
  let i = 0
  while (i < src.length) {
    const c = src[i]!
    if (/\s/.test(c)) {
      i++
      continue
    }
    if (c === '#') {
      while (i < src.length && src[i] !== '\n') i++
      continue
    }
    if (c === '"') {
      const parts: StrPart[] = []
      let cur = ''
      i++
      while (i < src.length && src[i] !== '"') {
        const d = src[i]!
        if (d === '\\') {
          const n = src[i + 1]
          if (n === '(') {
            // \( … ): an expression inside the string.
            let depth = 1
            let j = i + 2
            let inStr = false
            for (; j < src.length; j++) {
              const e = src[j]
              if (inStr) {
                if (e === '\\') j++
                else if (e === '"') inStr = false
                continue
              }
              if (e === '"') inStr = true
              else if (e === '(') depth++
              else if (e === ')' && --depth === 0) break
            }
            if (cur) parts.push(cur)
            cur = ''
            parts.push(parseJq(src.slice(i + 2, j)))
            i = j + 1
            continue
          }
          const map: Record<string, string> = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', '/': '/', '\\': '\\', '"': '"' }
          if (n === 'u') {
            cur += String.fromCharCode(parseInt(src.slice(i + 2, i + 6), 16))
            i += 6
            continue
          }
          if (n === undefined || map[n] === undefined) throw new JqCompileError(`invalid escape at line 1, column ${i + 1}`)
          cur += map[n]
          i += 2
          continue
        }
        cur += d
        i++
      }
      if (i >= src.length) throw new JqCompileError('unterminated string')
      i++
      if (cur || !parts.length) parts.push(cur)
      toks.push({ k: 'str', parts })
      continue
    }
    if (c === '.' && /[A-Za-z_]/.test(src[i + 1] ?? '')) {
      const m = /^[A-Za-z_]\w*/.exec(src.slice(i + 1))!
      toks.push({ k: 'field', v: m[0] })
      i += m[0].length + 1
      continue
    }
    if (c === '$') {
      const m = /^[A-Za-z_]\w*/.exec(src.slice(i + 1))
      if (!m) throw new JqCompileError('syntax error: unexpected $')
      toks.push({ k: 'var', v: m[0] })
      i += m[0].length + 1
      continue
    }
    if (c === '@') {
      const m = /^[A-Za-z_]\w*/.exec(src.slice(i + 1))
      if (!m) throw new JqCompileError('syntax error: unexpected @')
      toks.push({ k: 'format', v: m[0] })
      i += m[0].length + 1
      continue
    }
    const nm = /^(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/.exec(src.slice(i))
    if (nm && /[\d.]/.test(c) && (c !== '.' || /\d/.test(src[i + 1] ?? ''))) {
      toks.push({ k: 'num', v: Number(nm[0]), text: nm[0] })
      i += nm[0].length
      continue
    }
    const id = /^[A-Za-z_][\w]*(?:::[A-Za-z_]\w*)*/.exec(src.slice(i))
    if (id) {
      toks.push({ k: 'ident', v: id[0] })
      i += id[0].length
      continue
    }
    const op = JQ_OPS.find((o) => src.startsWith(o, i))
    if (!op) throw new JqCompileError(`syntax error, unexpected INVALID_CHARACTER (Unix shell quoting issues?) at <top-level>, line 1:\n${src}`)
    toks.push({ k: 'op', v: op })
    i += op.length
  }
  toks.push({ k: 'eof' })
  return toks
}

class JqCompileError extends Error {}

/* ── Parser ──────────────────────────────────────────────────────────────── */

type Ast =
  | { t: 'identity' }
  | { t: 'recurse' }
  | { t: 'field'; of: Ast; name: Ast; opt?: boolean }
  | { t: 'index'; of: Ast; idx: Ast }
  | { t: 'slice'; of: Ast; from?: Ast; to?: Ast }
  | { t: 'iterate'; of: Ast }
  | { t: 'try'; body: Ast; handler?: Ast }
  | { t: 'lit'; v: J }
  | { t: 'str'; parts: StrPart[]; format?: string }
  | { t: 'format'; name: string }
  | { t: 'array'; e?: Ast }
  | { t: 'object'; entries: { key: Ast; value?: Ast }[] }
  | { t: 'neg'; e: Ast }
  | { t: 'pipe'; a: Ast; b: Ast }
  | { t: 'comma'; a: Ast; b: Ast }
  | { t: 'alt'; a: Ast; b: Ast }
  | { t: 'bin'; op: string; a: Ast; b: Ast }
  | { t: 'and' | 'or'; a: Ast; b: Ast }
  | { t: 'assign'; op: string; a: Ast; b: Ast }
  | { t: 'var'; name: string }
  | { t: 'as'; src: Ast; name: string; body: Ast }
  | { t: 'reduce'; src: Ast; name: string; init: Ast; update: Ast }
  | { t: 'foreach'; src: Ast; name: string; init: Ast; update: Ast; extract?: Ast }
  | { t: 'if'; cond: Ast; then: Ast; else?: Ast }
  | { t: 'call'; name: string; args: Ast[] }
  | { t: 'def'; name: string; params: string[]; body: Ast; rest: Ast }

function parseJq(src: string): Ast {
  const toks = lexJq(src)
  let i = 0
  const peek = (n = 0) => toks[Math.min(i + n, toks.length - 1)]!
  const isOp = (v: string, t: Tok = peek()) => t.k === 'op' && t.v === v
  const isKw = (v: string, t: Tok = peek()) => t.k === 'ident' && t.v === v
  const fail = (): never => {
    const t = peek()
    const what = t.k === 'eof' ? 'end of file' : t.k === 'op' || t.k === 'ident' || t.k === 'field' || t.k === 'var' ? String(t.v) : t.k
    throw new JqCompileError(`syntax error, unexpected ${what} at <top-level>, line 1:\n${src}`)
  }
  const expectOp = (v: string) => {
    if (!isOp(v)) fail()
    i++
  }
  const expectKw = (v: string) => {
    if (!isKw(v)) fail()
    i++
  }

  function pipe(): Ast {
    if (isKw('def')) {
      const d = def()
      return { ...d, rest: pipe() }
    }
    const save = i
    if (!isOp('-')) {
      try {
        const term = postfix()
        if (isKw('as')) {
          i++
          const v = peek()
          if (v.k !== 'var') fail()
          i++
          expectOp('|')
          return { t: 'as', src: term, name: (v as { v: string }).v, body: pipe() }
        }
      } catch (e) {
        if (!(e instanceof JqCompileError)) throw e
      }
      i = save
    }
    const left = comma()
    if (isOp('|')) {
      i++
      return { t: 'pipe', a: left, b: pipe() }
    }
    return left
  }
  function def(): Extract<Ast, { t: 'def' }> {
    expectKw('def')
    const name = peek()
    if (name.k !== 'ident') fail()
    i++
    const params: string[] = []
    if (isOp('(')) {
      i++
      for (;;) {
        const p = peek()
        if (p.k === 'ident') params.push(p.v)
        else if (p.k === 'var') params.push(`$${p.v}`)
        else fail()
        i++
        if (isOp(';')) {
          i++
          continue
        }
        break
      }
      expectOp(')')
    }
    expectOp(':')
    const body = pipe()
    expectOp(';')
    return { t: 'def', name: (name as { v: string }).v, params, body, rest: { t: 'identity' } }
  }
  function comma(): Ast {
    let e = alt()
    while (isOp(',')) {
      i++
      e = { t: 'comma', a: e, b: alt() }
    }
    return e
  }
  function alt(): Ast {
    const a = assign()
    if (isOp('//')) {
      i++
      return { t: 'alt', a, b: alt() }
    }
    return a
  }
  function assign(): Ast {
    const a = or()
    const t = peek()
    if (t.k === 'op' && ['=', '|=', '+=', '-=', '*=', '/=', '%=', '//='].includes(t.v)) {
      i++
      return { t: 'assign', op: t.v, a, b: alt() }
    }
    return a
  }
  function or(): Ast {
    let e = and()
    while (isKw('or')) {
      i++
      e = { t: 'or', a: e, b: and() }
    }
    return e
  }
  function and(): Ast {
    let e = cmp()
    while (isKw('and')) {
      i++
      e = { t: 'and', a: e, b: cmp() }
    }
    return e
  }
  function cmp(): Ast {
    const a = additive()
    const t = peek()
    if (t.k === 'op' && ['==', '!=', '<', '<=', '>', '>='].includes(t.v)) {
      i++
      return { t: 'bin', op: t.v, a, b: additive() }
    }
    return a
  }
  function additive(): Ast {
    let e = multiplicative()
    while (isOp('+') || isOp('-')) {
      const op = (peek() as { v: string }).v
      i++
      e = { t: 'bin', op, a: e, b: multiplicative() }
    }
    return e
  }
  function multiplicative(): Ast {
    let e = unary()
    while (isOp('*') || isOp('/') || isOp('%')) {
      const op = (peek() as { v: string }).v
      i++
      e = { t: 'bin', op, a: e, b: unary() }
    }
    return e
  }
  function unary(): Ast {
    if (isOp('-')) {
      i++
      return { t: 'neg', e: postfix() }
    }
    return postfix()
  }
  function postfix(): Ast {
    let e = term()
    for (;;) {
      const t = peek()
      if (t.k === 'field') {
        i++
        e = { t: 'field', of: e, name: { t: 'lit', v: t.v } }
        continue
      }
      if (isOp('.') && peek(1).k === 'str') {
        i++
        const s = peek() as { parts: StrPart[] }
        i++
        e = { t: 'field', of: e, name: { t: 'str', parts: s.parts } }
        continue
      }
      if (isOp('[') || (isOp('.') && isOp('[', peek(1)))) {
        if (isOp('.')) i++
        e = bracket(e)
        continue
      }
      if (isOp('?')) {
        i++
        e = { t: 'try', body: e }
        continue
      }
      break
    }
    return e
  }
  function bracket(of: Ast): Ast {
    expectOp('[')
    if (isOp(']')) {
      i++
      return { t: 'iterate', of }
    }
    if (isOp(':')) {
      i++
      const to = pipe()
      expectOp(']')
      return { t: 'slice', of, to }
    }
    const idx = pipe()
    if (isOp(':')) {
      i++
      if (isOp(']')) {
        i++
        return { t: 'slice', of, from: idx }
      }
      const to = pipe()
      expectOp(']')
      return { t: 'slice', of, from: idx, to }
    }
    expectOp(']')
    return { t: 'index', of, idx }
  }
  function term(): Ast {
    const t = peek()
    switch (t.k) {
      case 'num':
        i++
        return { t: 'lit', v: String(t.v) === t.text ? t.v : new Lit(t.v, t.text) }
      case 'str':
        i++
        return { t: 'str', parts: t.parts }
      case 'field':
        i++
        return { t: 'field', of: { t: 'identity' }, name: { t: 'lit', v: t.v } }
      case 'var':
        i++
        return { t: 'var', name: t.v }
      case 'format': {
        i++
        const s = peek()
        if (s.k === 'str') {
          i++
          return { t: 'str', parts: s.parts, format: t.v }
        }
        return { t: 'format', name: t.v }
      }
      case 'op':
        if (t.v === '.') {
          i++
          if (peek().k === 'str') {
            const s = peek() as { parts: StrPart[] }
            i++
            return { t: 'field', of: { t: 'identity' }, name: { t: 'str', parts: s.parts } }
          }
          if (isOp('[')) return bracket({ t: 'identity' })
          return { t: 'identity' }
        }
        if (t.v === '..') {
          i++
          return { t: 'recurse' }
        }
        if (t.v === '(') {
          i++
          const e = pipe()
          expectOp(')')
          return e
        }
        if (t.v === '[') {
          i++
          if (isOp(']')) {
            i++
            return { t: 'array' }
          }
          const e = pipe()
          expectOp(']')
          return { t: 'array', e }
        }
        if (t.v === '{') {
          i++
          return object()
        }
        if (t.v === '-') {
          i++
          return { t: 'neg', e: postfix() }
        }
        return fail()
      case 'ident': {
        const w = t.v
        if (w === 'if') {
          i++
          const cond = pipe()
          expectKw('then')
          const then = pipe()
          const arms: [Ast, Ast][] = []
          let otherwise: Ast | undefined
          while (isKw('elif')) {
            i++
            const c = pipe()
            expectKw('then')
            arms.push([c, pipe()])
          }
          if (isKw('else')) {
            i++
            otherwise = pipe()
          }
          expectKw('end')
          let tail: Ast | undefined = otherwise
          for (const [c, b] of arms.reverse()) tail = { t: 'if', cond: c, then: b, ...(tail ? { else: tail } : {}) }
          return { t: 'if', cond, then, ...(tail ? { else: tail } : {}) }
        }
        if (w === 'reduce' || w === 'foreach') {
          i++
          const src = postfix()
          expectKw('as')
          const v = peek()
          if (v.k !== 'var') fail()
          i++
          expectOp('(')
          const init = pipe()
          expectOp(';')
          const update = pipe()
          let extract: Ast | undefined
          if (w === 'foreach' && isOp(';')) {
            i++
            extract = pipe()
          }
          expectOp(')')
          const name = (v as { v: string }).v
          return w === 'reduce' ? { t: 'reduce', src, name, init, update } : { t: 'foreach', src, name, init, update, ...(extract ? { extract } : {}) }
        }
        if (w === 'try') {
          i++
          const body = postfix()
          if (isKw('catch')) {
            i++
            return { t: 'try', body, handler: postfix() }
          }
          return { t: 'try', body }
        }
        if (w === 'def') {
          const d = def()
          return { ...d, rest: pipe() }
        }
        if ((w === 'null' || w === 'true' || w === 'false') && !isOp('(', peek(1))) {
          i++
          return { t: 'lit', v: w === 'null' ? null : w === 'true' }
        }
        if (KEYWORDS.includes(w) && w !== '__loc__') return fail()
        i++
        if (isOp('(')) {
          i++
          const args = [pipe()]
          while (isOp(';')) {
            i++
            args.push(pipe())
          }
          expectOp(')')
          return { t: 'call', name: w, args }
        }
        return { t: 'call', name: w, args: [] }
      }
      default:
        return fail()
    }
  }
  function object(): Ast {
    const entries: { key: Ast; value?: Ast }[] = []
    while (!isOp('}')) {
      const t = peek()
      let key: Ast
      if (t.k === 'var') {
        i++
        key = { t: 'var', name: t.v }
        entries.push({ key: { t: 'lit', v: t.v }, value: key })
        if (isOp(',')) i++
        continue
      }
      if (t.k === 'ident' || t.k === 'num') {
        i++
        key = { t: 'lit', v: t.k === 'ident' ? t.v : t.text }
      } else if (t.k === 'str') {
        i++
        key = { t: 'str', parts: t.parts }
      } else if (t.k === 'format' && peek(1).k === 'str') {
        i += 2
        key = { t: 'str', parts: (peek(-1) as { parts: StrPart[] }).parts, format: t.v }
      } else if (isOp('(')) {
        i++
        key = pipe()
        expectOp(')')
      } else return fail()
      if (isOp(':')) {
        i++
        let value = alt()
        while (isOp('|')) {
          i++
          value = { t: 'pipe', a: value, b: alt() }
        }
        entries.push({ key, value })
      } else entries.push({ key })
      if (isOp(',')) {
        i++
        continue
      }
      if (!isOp('}')) fail()
    }
    i++
    return { t: 'object', entries }
  }

  const ast = pipe()
  if (peek().k !== 'eof') fail()
  return ast
}

/* ── Evaluation ──────────────────────────────────────────────────────────── */

type Path = (string | number)[]
interface Def {
  params: string[]
  body: Ast
  env: Env
}
interface Env {
  vars: Map<string, J>
  defs: Map<string, Def>
  /** Filter arguments of the function being run: name → (the argument, where it came from). */
  closures: Map<string, { ast: Ast; env: Env }>
  parent?: Env
}

function lookupVar(env: Env, name: string): J {
  for (let e: Env | undefined = env; e; e = e.parent) if (e.vars.has(name)) return e.vars.get(name)!
  throw new JqCompileError(`$${name} is not defined`)
}
function lookupDef(env: Env, key: string): Def | undefined {
  for (let e: Env | undefined = env; e; e = e.parent) if (e.defs.has(key)) return e.defs.get(key)
  return undefined
}
function lookupClosure(env: Env, name: string): { ast: Ast; env: Env } | undefined {
  for (let e: Env | undefined = env; e; e = e.parent) if (e.closures.has(name)) return e.closures.get(name)
  return undefined
}
const child = (env: Env): Env => ({ vars: new Map(), defs: new Map(), closures: new Map(), parent: env })

function toStr(v: J): string {
  return typeof v === 'string' ? v : dump(v, true)
}

function index(v: J, k: J): J {
  if (v === null) {
    if (typeof k === 'string' || isNum(k) || k === null) return null
  }
  if (typeof k === 'string') {
    if (isObj(v)) return v.has(k) ? v.get(k)! : null
    throw new JqError(`Cannot index ${typeOf(v)} with ${typeof v === 'string' || isNum(v) ? 'string ' : ''}"${k}"`)
  }
  if (isNum(k)) {
    if (Array.isArray(v)) {
      let n = Math.floor(num(k))
      if (n < 0) n += v.length
      return n >= 0 && n < v.length ? v[n]! : null
    }
    throw new JqError(`Cannot index ${typeOf(v)} with number`)
  }
  if (isObj(k) && Array.isArray(v)) {
    throw new JqError(`Cannot index array with object`)
  }
  throw new JqError(`Cannot index ${typeOf(v)} with ${typeOf(k)}`)
}

function slice(v: J, from: J, to: J): J {
  if (v === null) return null
  if (typeof v !== 'string' && !Array.isArray(v)) throw new JqError(`Cannot index ${typeOf(v)} with object`)
  const items = typeof v === 'string' ? [...v] : v
  const len = items.length
  const clamp = (x: J, d: number) => {
    if (x === null) return d
    let n = Math.floor(num(x))
    if (n < 0) n += len
    return Math.max(0, Math.min(len, n))
  }
  const a = clamp(from, 0)
  const b = clamp(to, len)
  const out = items.slice(a, Math.max(a, b))
  return typeof v === 'string' ? (out as string[]).join('') : (out as J[])
}

function iterate(v: J): J[] {
  if (Array.isArray(v)) return v
  if (isObj(v)) return [...v.values()]
  throw new JqError(`Cannot iterate over ${desc(v)}`)
}

function add(a: J, b: J): J {
  if (a === null) return b
  if (b === null) return a
  if (isNum(a) && isNum(b)) return num(a) + num(b)
  if (typeof a === 'string' && typeof b === 'string') return a + b
  if (Array.isArray(a) && Array.isArray(b)) return [...a, ...b]
  if (isObj(a) && isObj(b)) return new Map([...a, ...b])
  throw new JqError(`${desc(a)} and ${desc(b)} cannot be added`)
}

function deepMerge(a: Map<string, J>, b: Map<string, J>): Map<string, J> {
  const out = new Map(a)
  for (const [k, v] of b) {
    const cur = out.get(k)
    out.set(k, cur !== undefined && isObj(cur) && isObj(v) ? deepMerge(cur, v) : v)
  }
  return out
}

function arith(op: string, a: J, b: J): J {
  switch (op) {
    case '+':
      return add(a, b)
    case '-':
      if (isNum(a) && isNum(b)) return num(a) - num(b)
      if (Array.isArray(a) && Array.isArray(b)) return a.filter((x) => !b.some((y) => equal(x, y)))
      throw new JqError(`${desc(a)} and ${desc(b)} cannot be subtracted`)
    case '*':
      if (isNum(a) && isNum(b)) return num(a) * num(b)
      if (typeof a === 'string' && isNum(b)) return num(b) > 0 ? a.repeat(Math.max(1, Math.ceil(num(b)))) : null
      if (isNum(a) && typeof b === 'string') return num(a) > 0 ? b.repeat(Math.max(1, Math.ceil(num(a)))) : null
      if (isObj(a) && isObj(b)) return deepMerge(a, b)
      throw new JqError(`${desc(a)} and ${desc(b)} cannot be multiplied`)
    case '/':
      if (isNum(a) && isNum(b)) {
        if (num(b) === 0) throw new JqError(`${desc(a)} and ${desc(b)} cannot be divided because the divisor is zero`)
        return num(a) / num(b)
      }
      if (typeof a === 'string' && typeof b === 'string') return splitStr(a, b)
      throw new JqError(`${desc(a)} and ${desc(b)} cannot be divided`)
    case '%': {
      if (isNum(a) && isNum(b)) {
        const y = Math.trunc(num(b))
        if (y === 0) throw new JqError(`${desc(a)} and ${desc(b)} cannot be divided because the divisor is zero`)
        const r = Math.trunc(num(a)) % Math.abs(y)
        return Object.is(r, -0) ? 0 : r
      }
      throw new JqError(`${desc(a)} and ${desc(b)} cannot be divided`)
    }
    case '==':
      return equal(a, b)
    case '!=':
      return !equal(a, b)
    case '<':
      return compare(a, b) < 0
    case '<=':
      return compare(a, b) <= 0
    case '>':
      return compare(a, b) > 0
    default:
      return compare(a, b) >= 0
  }
}

function splitStr(s: string, sep: string): J[] {
  if (s === '') return []
  return sep === '' ? [...s] : s.split(sep)
}

function getpath(v: J, p: Path): J {
  let cur = v
  for (const k of p) {
    if (cur === null) return null
    cur = index(cur, k)
  }
  return cur
}

function setpath(v: J, p: Path, x: J): J {
  if (!p.length) return x
  const [k, ...rest] = p
  if (typeof k === 'string') {
    if (v !== null && !isObj(v)) throw new JqError(`Cannot index ${typeOf(v)} with "${k}"`)
    const m = new Map(v ?? [])
    m.set(k, setpath(m.get(k) ?? null, rest, x))
    return m
  }
  if (v !== null && !Array.isArray(v)) throw new JqError(`Cannot index ${typeOf(v)} with number`)
  const a = [...(v ?? [])]
  let n = k!
  if (n < 0) {
    n += a.length
    if (n < 0) throw new JqError('Out of bounds negative array index')
  }
  while (a.length <= n) a.push(null)
  a[n] = setpath(a[n] ?? null, rest, x)
  return a
}

function delpaths(v: J, paths: Path[]): J {
  const sorted = [...paths].sort((a, b) => compare(b, a))
  let out = v
  for (const p of sorted) out = delpath(out, p)
  return out
}

function delpath(v: J, p: Path): J {
  if (!p.length || v === null) return p.length ? v : null
  const [k, ...rest] = p
  if (rest.length) {
    const inner = index(v, k!)
    if (inner === null) return v
    return setpath(v, [k!], delpath(inner, rest))
  }
  if (isObj(v) && typeof k === 'string') {
    const m = new Map(v)
    m.delete(k)
    return m
  }
  if (Array.isArray(v) && typeof k === 'number') {
    const n = k < 0 ? k + v.length : k
    return v.filter((_, i) => i !== n)
  }
  throw new JqError(`Cannot delete field at index ${JSON.stringify(k)} of ${typeOf(v)}`)
}

/** Every path into a value, depth first (for .. and paths). */
function allPaths(v: J, prefix: Path = []): Path[] {
  const out: Path[] = [prefix]
  if (Array.isArray(v)) v.forEach((x, i) => out.push(...allPaths(x, [...prefix, i])))
  else if (isObj(v)) for (const [k, x] of v) out.push(...allPaths(x, [...prefix, k]))
  return out
}

function jqRegex(re: J, flags: J): RegExp {
  if (typeof re !== 'string') throw new JqError(`${desc(re)} cannot be matched, as it is not a string`)
  let f = ''
  const fl = typeof flags === 'string' ? flags : ''
  if (fl.includes('g')) f += 'g'
  if (fl.includes('i')) f += 'i'
  if (fl.includes('x')) re = re.replace(/\s+|#.*$/gm, '')
  if (fl.includes('s')) f += 's'
  try {
    return new RegExp(re, `${f}u`)
  } catch {
    throw new JqError(`${re} (at offset 0) is not a valid regex`)
  }
}

function matchObj(m: RegExpExecArray, s: string): J {
  const cp = (i: number) => [...s.slice(0, i)].length
  const names = m.groups ? Object.keys(m.groups) : []
  const caps: J[] = []
  for (let g = 1; g < m.length; g++) {
    const text = m[g]
    const off = text === undefined ? -1 : cp(m.index + m[0].indexOf(text))
    caps.push(new Map<string, J>([['offset', off], ['length', text === undefined ? 0 : [...text].length], ['string', text ?? null], ['name', names[g - 1] ?? null]]))
  }
  return new Map<string, J>([['offset', cp(m.index)], ['length', [...m[0]].length], ['string', m[0]], ['captures', caps]])
}

function formatValue(name: string, v: J): string {
  switch (name) {
    case 'text':
      return toStr(v)
    case 'json':
      return dump(v, true)
    case 'csv':
    case 'tsv': {
      if (!Array.isArray(v)) throw new JqError(`${desc(v)} cannot be ${name}-formatted, only an array can be`)
      return v
        .map((x) => {
          if (x === null) return ''
          if (typeof x === 'boolean' || isNum(x)) return dump(x, true)
          if (typeof x === 'string') return name === 'csv' ? `"${x.replace(/"/g, '""')}"` : x.replace(/\\/g, '\\\\').replace(/\t/g, '\\t').replace(/\n/g, '\\n').replace(/\r/g, '\\r')
          throw new JqError(`${desc(x)} is not valid in a ${name} row`)
        })
        .join(name === 'csv' ? ',' : '\t')
    }
    case 'html':
      return toStr(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;').replace(/"/g, '&quot;')
    case 'uri':
      return [...new TextEncoder().encode(toStr(v))].map((b) => (/[A-Za-z0-9\-_.~]/.test(String.fromCharCode(b)) ? String.fromCharCode(b) : `%${b.toString(16).toUpperCase().padStart(2, '0')}`)).join('')
    case 'sh': {
      const q = (x: J) => {
        if (typeof x === 'string') return `'${x.replace(/'/g, `'\\''`)}'`
        if (Array.isArray(x) || isObj(x)) throw new JqError(`${desc(x)} can not be escaped for shell`)
        return dump(x, true)
      }
      return Array.isArray(v) ? v.map(q).join(' ') : q(v)
    }
    case 'base64': {
      const bytes = new TextEncoder().encode(toStr(v))
      let bin = ''
      for (const b of bytes) bin += String.fromCharCode(b)
      return btoa(bin)
    }
    case 'base64d': {
      const bin = atob(toStr(v).replace(/=+$/, '').padEnd(Math.ceil(toStr(v).replace(/=+$/, '').length / 4) * 4, '='))
      return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
    }
  }
  throw new JqCompileError(`${name} is not a valid format`)
}

class Interp {
  env0: Env
  inputs: J[]
  steps = 0
  constructor(vars: Map<string, J>, inputs: J[]) {
    this.env0 = { vars, defs: new Map(), closures: new Map() }
    this.inputs = inputs
  }

  ev(a: Ast, v: J, env: Env): J[] {
    if (++this.steps > 3_000_000) throw new JqError('the program ran too long — the practice terminal stops it')
    switch (a.t) {
      case 'identity':
        return [v]
      case 'recurse':
        return allPaths(v).map((p) => getpath(v, p))
      case 'lit':
        return [a.v]
      case 'str': {
        let outs = ['']
        for (const p of a.parts) {
          if (typeof p === 'string') {
            outs = outs.map((o) => o + p)
            continue
          }
          const vals = this.ev(p, v, env).map((x) => (a.format ? formatValue(a.format, x) : toStr(x)))
          outs = outs.flatMap((o) => vals.map((x) => o + x))
        }
        return outs
      }
      case 'format':
        return [formatValue(a.name, v)]
      case 'field':
        return this.ev(a.of, v, env).flatMap((o) => this.ev(a.name, v, env).map((k) => index(o, k)))
      case 'index':
        return this.ev(a.of, v, env).flatMap((o) => this.ev(a.idx, v, env).map((k) => index(o, k)))
      case 'slice':
        return this.ev(a.of, v, env).flatMap((o) => {
          const froms = a.from ? this.ev(a.from, v, env) : [null]
          const tos = a.to ? this.ev(a.to, v, env) : [null]
          return froms.flatMap((f) => tos.map((t) => slice(o, f, t)))
        })
      case 'iterate':
        return this.ev(a.of, v, env).flatMap(iterate)
      case 'try': {
        const out: J[] = []
        try {
          out.push(...this.ev(a.body, v, env))
        } catch (e) {
          if (!(e instanceof JqError)) throw e
          if (e instanceof BreakOut) throw e
          if (a.handler) return [...out, ...this.ev(a.handler, e.value, env)]
        }
        return out
      }
      case 'array':
        return [a.e ? this.ev(a.e, v, env) : []]
      case 'object': {
        let outs: Map<string, J>[] = [new Map()]
        for (const en of a.entries) {
          const keys = this.ev(en.key, v, env)
          const next: Map<string, J>[] = []
          for (const k of keys) {
            if (typeof k !== 'string') throw new JqError(`Cannot use ${desc(k)} as object key`)
            const vals = en.value ? this.ev(en.value, v, env) : [index(v, k)]
            for (const o of outs) for (const x of vals) next.push(new Map([...o, [k, x]]))
          }
          outs = next
        }
        return outs
      }
      case 'neg':
        return this.ev(a.e, v, env).map((x) => {
          if (!isNum(x)) throw new JqError(`${desc(x)} cannot be negated`)
          return -num(x)
        })
      case 'pipe':
        return this.ev(a.a, v, env).flatMap((x) => this.ev(a.b, x, env))
      case 'comma':
        return [...this.ev(a.a, v, env), ...this.ev(a.b, v, env)]
      case 'alt': {
        let good: J[] = []
        try {
          good = this.ev(a.a, v, env).filter(truthy)
        } catch (e) {
          if (!(e instanceof JqError)) throw e
        }
        return good.length ? good : this.ev(a.b, v, env)
      }
      case 'and':
        return this.ev(a.a, v, env).flatMap((x) => (truthy(x) ? this.ev(a.b, v, env).map(truthy) : [false]))
      case 'or':
        return this.ev(a.a, v, env).flatMap((x) => (truthy(x) ? [true] : this.ev(a.b, v, env).map(truthy)))
      case 'bin': {
        const rs = this.ev(a.b, v, env)
        return this.ev(a.a, v, env).flatMap((l) => rs.map((r) => arith(a.op, l, r)))
      }
      case 'assign':
        return this.assign(a, v, env)
      case 'var':
        if (a.name === '__loc__') return [new Map<string, J>([['file', '<top-level>'], ['line', 1]])]
        return [lookupVar(env, a.name)]
      case 'as':
        return this.ev(a.src, v, env).flatMap((x) => {
          const e = child(env)
          e.vars.set(a.name, x)
          return this.ev(a.body, v, e)
        })
      case 'reduce': {
        let accs = this.ev(a.init, v, env)
        for (const x of this.ev(a.src, v, env)) {
          const e = child(env)
          e.vars.set(a.name, x)
          accs = accs.flatMap((acc) => {
            const r = this.ev(a.update, acc, e)
            return r.length ? [r[r.length - 1]!] : [null]
          })
        }
        return accs
      }
      case 'foreach': {
        const out: J[] = []
        for (let acc of this.ev(a.init, v, env)) {
          for (const x of this.ev(a.src, v, env)) {
            const e = child(env)
            e.vars.set(a.name, x)
            for (const r of this.ev(a.update, acc, e)) {
              acc = r
              out.push(...(a.extract ? this.ev(a.extract, r, e) : [r]))
            }
          }
        }
        return out
      }
      case 'if':
        return this.ev(a.cond, v, env).flatMap((c) => (truthy(c) ? this.ev(a.then, v, env) : a.else ? this.ev(a.else, v, env) : [v]))
      case 'def': {
        const e = child(env)
        const d: Def = { params: a.params, body: a.body, env: e }
        e.defs.set(`${a.name}/${a.params.length}`, d)
        return this.ev(a.rest, v, e)
      }
      case 'call':
        return this.call(a, v, env)
    }
  }

  /** The paths a path expression (.a, .[0], .[], select(…), |, …) points at. */
  paths(a: Ast, v: J, env: Env): Path[] {
    switch (a.t) {
      case 'identity':
        return [[]]
      case 'recurse':
        return allPaths(v)
      case 'field':
        return this.paths(a.of, v, env).flatMap((p) => this.ev(a.name, v, env).map((k) => [...p, k as string]))
      case 'index':
        return this.paths(a.of, v, env).flatMap((p) =>
          this.ev(a.idx, v, env).map((k) => {
            if (isNum(k)) return [...p, Math.floor(num(k))]
            if (typeof k === 'string') return [...p, k]
            if (k === null) return [...p, 0]
            throw new JqError(`Cannot update field at object index of ${typeOf(getpath(v, p))}`)
          }),
        )
      case 'iterate':
        return this.paths(a.of, v, env).flatMap((p) => {
          const x = getpath(v, p)
          if (Array.isArray(x)) return x.map((_, i) => [...p, i])
          if (isObj(x)) return [...x.keys()].map((k) => [...p, k])
          if (x === null) return []
          throw new JqError(`Cannot iterate over ${desc(x)}`)
        })
      case 'pipe':
        return this.paths(a.a, v, env).flatMap((p) => this.paths(a.b, getpath(v, p), env).map((q) => [...p, ...q]))
      case 'comma':
        return [...this.paths(a.a, v, env), ...this.paths(a.b, v, env)]
      case 'if':
        return this.ev(a.cond, v, env).flatMap((c) => (truthy(c) ? this.paths(a.then, v, env) : a.else ? this.paths(a.else, v, env) : [[]]))
      case 'try':
        try {
          return this.paths(a.body, v, env)
        } catch (e) {
          if (!(e instanceof JqError)) throw e
          return []
        }
      case 'alt': {
        const left = this.paths(a.a, v, env).filter((p) => truthy(getpath(v, p)))
        return left.length ? left : this.paths(a.b, v, env)
      }
      case 'as':
        return this.ev(a.src, v, env).flatMap((x) => {
          const e = child(env)
          e.vars.set(a.name, x)
          return this.paths(a.body, v, e)
        })
      case 'call': {
        if (a.name === 'select' && a.args.length === 1) return this.ev(a.args[0]!, v, env).some(truthy) ? [[]] : []
        if (a.name === 'empty' && !a.args.length) return []
        if (a.name === 'getpath' && a.args.length === 1) return this.ev(a.args[0]!, v, env).map((p) => p as Path)
        if ((a.name === 'first' || a.name === 'last') && a.args.length === 1) {
          const ps = this.paths(a.args[0]!, v, env)
          const p = a.name === 'first' ? ps[0] : ps[ps.length - 1]
          return p ? [p] : []
        }
        if (a.name === 'recurse' && !a.args.length) return allPaths(v)
        if (a.name === 'map' && a.args.length === 1) return this.paths({ t: 'pipe', a: { t: 'iterate', of: { t: 'identity' } }, b: a.args[0]! }, v, env)
        const cl = !a.args.length ? lookupClosure(env, a.name) : undefined
        if (cl) return this.paths(cl.ast, v, cl.env)
        const d = lookupDef(env, `${a.name}/${a.args.length}`)
        if (d) {
          const e = this.bindArgs(d, a.args, v, env)
          return e.flatMap((en) => this.paths(d.body, v, en))
        }
        break
      }
    }
    throw new JqError(`Invalid path expression with result ${dump(this.ev(a, v, env)[0] ?? null, true).slice(0, 11)}`)
  }

  assign(a: Extract<Ast, { t: 'assign' }>, v: J, env: Env): J[] {
    if (a.op === '|=') {
      let out = v
      for (const p of this.paths(a.a, v, env)) {
        const r = this.ev(a.b, getpath(out, p), env)
        out = r.length ? setpath(out, p, r[0]!) : delpaths(out, [p])
      }
      return [out]
    }
    const rhs = this.ev(a.b, v, env)
    return rhs.map((r) => {
      let out = v
      for (const p of this.paths(a.a, v, env)) {
        if (a.op === '=') out = setpath(out, p, r)
        else if (a.op === '//=') {
          const cur = getpath(out, p)
          out = setpath(out, p, truthy(cur) ? cur : r)
        } else out = setpath(out, p, arith(a.op[0]!, getpath(out, p), r))
      }
      return out
    })
  }

  bindArgs(d: Def, args: Ast[], v: J, env: Env): Env[] {
    let envs: Env[] = [child(d.env)]
    d.params.forEach((p, i) => {
      const arg = args[i]!
      if (p.startsWith('$')) {
        const vals = this.ev(arg, v, env)
        envs = envs.flatMap((e) =>
          vals.map((x) => {
            const n = child(e)
            n.vars.set(p.slice(1), x)
            n.closures.set(p.slice(1), { ast: { t: 'lit', v: x }, env })
            return n
          }),
        )
      } else for (const e of envs) e.closures.set(p, { ast: arg, env })
    })
    return envs
  }

  call(a: Extract<Ast, { t: 'call' }>, v: J, env: Env): J[] {
    const args = a.args
    if (!args.length) {
      const cl = lookupClosure(env, a.name)
      if (cl) return this.ev(cl.ast, v, cl.env)
    }
    const d = lookupDef(env, `${a.name}/${args.length}`)
    if (d) return this.bindArgs(d, args, v, env).flatMap((e) => this.ev(d.body, v, e))
    const arg = (i: number) => this.ev(args[i]!, v, env)
    const one = (f: (x: J) => J): J[] => [f(v)]
    const each1 = (f: (x: J) => J): J[] => arg(0).map(f)
    const n = args.length
    const key = `${a.name}/${n}`
    switch (key) {
      case 'empty/0':
        return []
      case 'not/0':
        return [!truthy(v)]
      case 'length/0':
        return one((x) => {
          if (x === null) return 0
          if (typeof x === 'boolean') throw new JqError(`boolean (${x}) has no length`)
          if (isNum(x)) return Math.abs(num(x))
          if (typeof x === 'string') return [...x].length
          if (Array.isArray(x)) return x.length
          return x.size
        })
      case 'utf8bytelength/0':
        return one((x) => {
          if (typeof x !== 'string') throw new JqError(`${desc(x)} only strings have UTF-8 byte length`)
          return new TextEncoder().encode(x).length
        })
      case 'keys/0':
      case 'keys_unsorted/0':
        return one((x) => {
          if (Array.isArray(x)) return x.map((_, i) => i)
          if (isObj(x)) return a.name === 'keys' ? [...x.keys()].sort(cmpStr) : [...x.keys()]
          throw new JqError(`${desc(x)} has no keys`)
        })
      case 'values/0':
        return truthy(v) || v === false ? (v === null ? [] : [v]) : []
      case 'has/1':
        return each1((k) => {
          if (isObj(v) && typeof k === 'string') return v.has(k)
          if (Array.isArray(v) && isNum(k)) return num(k) >= 0 && num(k) < v.length
          throw new JqError(`Cannot check whether ${typeOf(v)} has a ${typeOf(k)} key`)
        })
      case 'in/1':
        return each1((o) => {
          if (isObj(o) && typeof v === 'string') return o.has(v)
          if (Array.isArray(o) && isNum(v)) return num(v) >= 0 && num(v) < o.length
          throw new JqError(`Cannot check whether ${typeOf(o)} has a ${typeOf(v)} key`)
        })
      case 'map/1':
        return [iterate(v).flatMap((x) => this.ev(args[0]!, x, env))]
      case 'map_values/1': {
        if (Array.isArray(v)) return [v.flatMap((x) => this.ev(args[0]!, x, env).slice(0, 1))]
        if (isObj(v)) {
          const m = new Map<string, J>()
          for (const [k, x] of v) {
            const r = this.ev(args[0]!, x, env)
            if (r.length) m.set(k, r[0]!)
          }
          return [m]
        }
        throw new JqError(`Cannot iterate over ${desc(v)}`)
      }
      case 'select/1':
        return arg(0).filter(truthy).map(() => v)
      case 'error/0':
        throw new JqError(v)
      case 'error/1':
        throw new JqError(arg(0)[0] ?? null)
      case 'add/0':
        return [iterate(v).reduce<J>((acc, x) => add(acc, x), null)]
      case 'any/0':
        return [iterate(v).some(truthy)]
      case 'all/0':
        return [iterate(v).every(truthy)]
      case 'any/1':
        return [iterate(v).some((x) => this.ev(args[0]!, x, env).some(truthy))]
      case 'all/1':
        return [iterate(v).every((x) => this.ev(args[0]!, x, env).every(truthy))]
      case 'any/2':
        return [this.ev(args[0]!, v, env).some((x) => this.ev(args[1]!, x, env).some(truthy))]
      case 'all/2':
        return [this.ev(args[0]!, v, env).every((x) => this.ev(args[1]!, x, env).every(truthy))]
      case 'range/1':
        return arg(0).flatMap((e) => {
          const out: J[] = []
          for (let i = 0; i < num(e); i++) out.push(i)
          return out
        })
      case 'range/2':
      case 'range/3': {
        const out: J[] = []
        for (const from of arg(0))
          for (const to of arg(1))
            for (const by of n === 3 ? arg(2) : [1]) {
              const step = num(by)
              if (step === 0) continue
              for (let i = num(from); step > 0 ? i < num(to) : i > num(to); i += step) {
                out.push(i)
                if (out.length > 100000) throw new JqError('range too long for the practice terminal')
              }
            }
        return out
      }
      case 'floor/0':
      case 'ceil/0':
      case 'round/0':
      case 'sqrt/0':
      case 'fabs/0':
      case 'abs/0':
      case 'log/0':
      case 'log10/0':
      case 'log2/0':
      case 'exp/0':
      case 'exp10/0':
      case 'trunc/0':
        return one((x) => {
          if (!isNum(x)) throw new JqError(`${desc(x)} number required`)
          const f: Record<string, (y: number) => number> = { floor: Math.floor, ceil: Math.ceil, round: Math.round, sqrt: Math.sqrt, fabs: Math.abs, abs: Math.abs, log: Math.log, log10: Math.log10, log2: Math.log2, exp: Math.exp, exp10: (y) => 10 ** y, trunc: Math.trunc }
          return f[a.name]!(num(x))
        })
      case 'pow/2':
        return arg(0).flatMap((b) => arg(1).map((e) => num(b) ** num(e)))
      case 'min/0':
      case 'max/0':
        return one((x) => {
          const items = iterate(x)
          if (!items.length) return null
          return items.reduce((m, y) => ((a.name === 'min' ? compare(y, m) < 0 : compare(y, m) >= 0) ? y : m))
        })
      case 'min_by/1':
      case 'max_by/1':
        return one((x) => {
          const items = iterate(x)
          if (!items.length) return null
          const keyed = items.map((y) => [this.ev(args[0]!, y, env), y] as const)
          return keyed.reduce((m, y) => ((a.name === 'min_by' ? compare(y[0], m[0]) < 0 : compare(y[0], m[0]) >= 0) ? y : m))[1]
        })
      case 'sort/0':
        return one((x) => {
          if (!Array.isArray(x)) throw new JqError(`${desc(x)} cannot be sorted, as it is not an array`)
          return [...x].sort(compare)
        })
      case 'sort_by/1':
      case 'group_by/1':
      case 'unique_by/1': {
        if (!Array.isArray(v)) throw new JqError(`Cannot index ${typeOf(v)} with number`)
        const keyed = v.map((x, i) => ({ k: this.ev(args[0]!, x, env) as J, x, i })).sort((p, q) => compare(p.k, q.k) || p.i - q.i)
        if (a.name === 'sort_by') return [keyed.map((e) => e.x)]
        const groups: J[][] = []
        let last: J = null
        keyed.forEach((e, i) => {
          if (i === 0 || !equal(e.k, last)) groups.push([e.x])
          else groups[groups.length - 1]!.push(e.x)
          last = e.k
        })
        return [a.name === 'group_by' ? groups : groups.map((g) => g[0]!)]
      }
      case 'unique/0':
        return one((x) => {
          if (!Array.isArray(x)) throw new JqError(`${desc(x)} cannot be sorted, as it is not an array`)
          return [...x].sort(compare).filter((y, i, all) => i === 0 || !equal(y, all[i - 1]!))
        })
      case 'reverse/0':
        return one((x) => (x === null ? [] : typeof x === 'string' ? [...x].reverse().join('') : Array.isArray(x) ? [...x].reverse() : (() => {
          throw new JqError(`Cannot reverse ${desc(x)}`)
        })()))
      case 'contains/1':
        return each1((b) => contains(v, b))
      case 'inside/1':
        return each1((b) => contains(b, v))
      case 'startswith/1':
      case 'endswith/1':
        return each1((b) => {
          if (typeof v !== 'string' || typeof b !== 'string') throw new JqError(`${a.name}() requires string inputs`)
          return a.name === 'startswith' ? v.startsWith(b) : v.endsWith(b)
        })
      case 'ltrimstr/1':
        return each1((b) => (typeof v === 'string' && typeof b === 'string' && v.startsWith(b) ? v.slice(b.length) : v))
      case 'rtrimstr/1':
        return each1((b) => (typeof v === 'string' && typeof b === 'string' && b && v.endsWith(b) ? v.slice(0, v.length - b.length) : v))
      case 'trim/0':
      case 'ltrim/0':
      case 'rtrim/0':
        return one((x) => {
          if (typeof x !== 'string') throw new JqError(`${desc(x)} cannot be trimmed`)
          return a.name === 'trim' ? x.trim() : a.name === 'ltrim' ? x.trimStart() : x.trimEnd()
        })
      case 'explode/0':
        return one((x) => [...(x as string)].map((c) => c.codePointAt(0)!))
      case 'implode/0':
        return one((x) => String.fromCodePoint(...(x as J[]).map(num)))
      case 'split/1':
        return each1((sep) => {
          if (typeof v !== 'string' || typeof sep !== 'string') throw new JqError('split input and separator must be strings')
          return splitStr(v, sep)
        })
      case 'split/2':
        return arg(0).flatMap((re) => arg(1).map((fl) => (v as string).split(jqRegex(re, fl))))
      case 'splits/1':
      case 'splits/2':
        return arg(0).flatMap((re) => {
          if (typeof v !== 'string') throw new JqError(`${desc(v)} cannot be matched, as it is not a string`)
          return v.split(jqRegex(re, n === 2 ? arg(1)[0]! : null))
        })
      case 'join/1':
        return each1((sep) => {
          const items = iterate(v)
          return items
            .map((x) => {
              if (x === null) return ''
              if (typeof x === 'string') return x
              if (typeof x === 'boolean' || isNum(x)) return dump(x, true)
              throw new JqError(`Cannot join with ${typeOf(x)}`)
            })
            .join(typeof sep === 'string' ? sep : '')
        })
      case 'ascii_downcase/0':
      case 'ascii_upcase/0':
        return one((x) => {
          if (typeof x !== 'string') throw new JqError(`${desc(x)} cannot be ${a.name === 'ascii_downcase' ? 'lowercased' : 'uppercased'}`)
          return a.name === 'ascii_downcase' ? x.replace(/[A-Z]/g, (c) => c.toLowerCase()) : x.replace(/[a-z]/g, (c) => c.toUpperCase())
        })
      case 'tostring/0':
        return one(toStr)
      case 'tonumber/0':
        return one((x) => {
          if (isNum(x)) return x
          if (typeof x === 'string' && /^\s*-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?\s*$/.test(x)) return Number(x)
          throw new JqError(`Cannot parse '${toStr(x)}' as JSON`)
        })
      case 'type/0':
        return one(typeOf)
      case 'arrays/0':
      case 'objects/0':
      case 'iterables/0':
      case 'booleans/0':
      case 'numbers/0':
      case 'strings/0':
      case 'nulls/0':
      case 'scalars/0': {
        const t = typeOf(v)
        const keep = { arrays: t === 'array', objects: t === 'object', iterables: t === 'array' || t === 'object', booleans: t === 'boolean', numbers: t === 'number', strings: t === 'string', nulls: t === 'null', scalars: t !== 'array' && t !== 'object' }[a.name]
        return keep ? [v] : []
      }
      case 'first/0':
        return [index(v, 0)]
      case 'last/0':
        return [index(v, -1)]
      case 'first/1': {
        const r = arg(0)
        return r.length ? [r[0]!] : []
      }
      case 'last/1': {
        const r = arg(0)
        return r.length ? [r[r.length - 1]!] : []
      }
      case 'nth/1':
        return each1((k) => index(v, k))
      case 'nth/2':
        return arg(0).flatMap((k) => {
          const r = arg(1)
          const i = num(k)
          return i < r.length ? [r[i]!] : []
        })
      case 'limit/2':
        return arg(0).flatMap((k) => arg(1).slice(0, Math.max(0, num(k))))
      case 'until/2': {
        let cur = v
        for (let guard = 0; guard < 100000; guard++) {
          if (this.ev(args[0]!, cur, env).some(truthy)) return [cur]
          cur = this.ev(args[1]!, cur, env)[0] ?? null
        }
        throw new JqError('until ran too long')
      }
      case 'while/2': {
        const out: J[] = []
        let cur = v
        for (let guard = 0; guard < 100000 && this.ev(args[0]!, cur, env).some(truthy); guard++) {
          out.push(cur)
          cur = this.ev(args[1]!, cur, env)[0] ?? null
        }
        return out
      }
      case 'recurse/0':
        return allPaths(v).map((p) => getpath(v, p))
      case 'recurse/1': {
        const out: J[] = []
        const walk = (x: J) => {
          out.push(x)
          if (out.length > 100000) throw new JqError('recurse went too deep')
          for (const y of this.ev(args[0]!, x, env)) walk(y)
        }
        walk(v)
        return out
      }
      case 'to_entries/0':
        return one((x) => {
          if (!isObj(x)) throw new JqError(`${desc(x)} has no keys`)
          return [...x].map(([k, y]) => new Map<string, J>([['key', k], ['value', y]]))
        })
      case 'from_entries/0':
        return one((x) => {
          const m = new Map<string, J>()
          for (const e of iterate(x)) {
            if (!isObj(e)) throw new JqError(`Cannot index ${typeOf(e)} with "key"`)
            const k = ['key', 'k', 'name', 'Name', 'Key', 'K'].map((n2) => e.get(n2)).find((y) => y !== undefined && y !== null && y !== false) ?? null
            const val = ['value', 'v', 'Value', 'V'].map((n2) => e.get(n2)).find((y) => y !== undefined) ?? null
            if (typeof k === 'string') m.set(k, val)
            else if (isNum(k) || typeof k === 'boolean') m.set(dump(k, true), val)
            else throw new JqError(`Cannot use ${desc(k)} as object key`)
          }
          return m
        })
      case 'with_entries/1':
        return this.ev(parseJq('to_entries | map(__f__) | from_entries'), v, this.withClosure(env, '__f__', args[0]!))
      case 'walk/1': {
        const walk = (x: J): J => {
          let y: J = x
          if (Array.isArray(x)) y = x.map(walk)
          else if (isObj(x)) y = new Map([...x].map(([k, z]) => [k, walk(z)]))
          return this.ev(args[0]!, y, env)[0] ?? null
        }
        return [walk(v)]
      }
      case 'paths/0':
        return allPaths(v).slice(1)
      case 'paths/1':
        return allPaths(v)
          .slice(1)
          .filter((p) => this.ev(args[0]!, getpath(v, p), env).some(truthy))
      case 'leaf_paths/0':
        return allPaths(v)
          .slice(1)
          .filter((p) => {
            const x = getpath(v, p)
            return !Array.isArray(x) && !isObj(x)
          })
      case 'path/1':
        return this.paths(args[0]!, v, env)
      case 'getpath/1':
        return each1((p) => {
          try {
            return getpath(v, p as Path)
          } catch {
            return null
          }
        })
      case 'setpath/2':
        return arg(0).flatMap((p) => arg(1).map((x) => setpath(v, p as Path, x)))
      case 'delpaths/1':
        return each1((ps) => delpaths(v, ps as Path[]))
      case 'del/1':
        return [delpaths(v, this.paths(args[0]!, v, env))]
      case 'to_array/0':
      case 'toarray/0':
        return [Array.isArray(v) ? v : [v]]
      case 'flatten/0':
      case 'flatten/1':
        return (n ? arg(0) : [1e9]).map((d) => {
          if (num(d) < 0) throw new JqError('flatten depth must not be negative')
          const flat = (x: J[], depth: number): J[] => x.flatMap((y) => (Array.isArray(y) && depth > 0 ? flat(y, depth - 1) : [y]))
          if (!Array.isArray(v)) throw new JqError(`Cannot iterate over ${desc(v)}`)
          return flat(v, num(d))
        })
      case 'transpose/0':
        return one((x) => {
          const rows = x as J[][]
          const w = Math.max(0, ...rows.map((r) => r.length))
          return Array.from({ length: w }, (_, i) => rows.map((r) => r[i] ?? null))
        })
      case 'tojson/0':
        return one((x) => dump(x, true))
      case 'fromjson/0':
        return one((x) => {
          const r = parseJsonStream(toStr(x))
          if (r.error || r.values.length !== 1) throw new JqError(`${toStr(x)} (while parsing '${toStr(x)}')`)
          return r.values[0]!
        })
      case 'test/1':
      case 'test/2':
        return arg(0).flatMap((re) => (n === 2 ? arg(1) : [null]).map((fl) => jqRegex(re, fl).test(v as string)))
      case 'match/1':
      case 'match/2':
        return arg(0).flatMap((re) =>
          (n === 2 ? arg(1) : [null]).flatMap((fl) => {
            if (typeof v !== 'string') throw new JqError(`${desc(v)} cannot be matched, as it is not a string`)
            const rx = jqRegex(re, fl)
            if (!rx.global) {
              const m = rx.exec(v)
              return m ? [matchObj(m, v)] : []
            }
            return [...v.matchAll(rx)].map((m) => matchObj(m, v))
          }),
        )
      case 'capture/1':
      case 'capture/2':
        return arg(0).flatMap((re) =>
          (n === 2 ? arg(1) : [null]).flatMap((fl) => {
            if (typeof v !== 'string') throw new JqError(`${desc(v)} cannot be matched, as it is not a string`)
            const m = jqRegex(re, fl).exec(v)
            return m ? [new Map<string, J>(Object.entries(m.groups ?? {}).map(([k, x]) => [k, x ?? null]))] : []
          }),
        )
      case 'sub/2':
      case 'sub/3':
      case 'gsub/2':
      case 'gsub/3':
        return arg(0).flatMap((re) =>
          (n === 3 ? arg(2) : [null]).flatMap((fl) => {
            if (typeof v !== 'string') throw new JqError(`${desc(v)} cannot be matched, as it is not a string`)
            const flags = `${typeof fl === 'string' ? fl : ''}${a.name === 'gsub' ? 'g' : ''}`
            const rx = jqRegex(re, flags)
            let out = ''
            let last = 0
            const ms = rx.global ? [...v.matchAll(rx)] : [rx.exec(v)].filter((m): m is RegExpExecArray => !!m)
            for (const m of ms) {
              const caps = new Map<string, J>(Object.entries(m.groups ?? {}).map(([k, x]) => [k, x ?? null]))
              const rep = this.ev(args[1]!, caps, env)[0]
              out += v.slice(last, m.index) + toStr(rep ?? '')
              last = m.index + m[0].length
            }
            return [out + v.slice(last)]
          }),
        )
      case 'ascii/0':
        return one((x) => String.fromCharCode(num(x)))
      case 'indices/1':
      case 'index/1':
      case 'rindex/1':
        return each1((b) => {
          let idx: number[] = []
          if (typeof v === 'string' && typeof b === 'string') {
            if (b) for (let i = v.indexOf(b); i >= 0; i = v.indexOf(b, i + 1)) idx.push(i)
          } else if (Array.isArray(v)) {
            const pat = Array.isArray(b) ? b : [b]
            if (pat.length) for (let i = 0; i + pat.length <= v.length; i++) if (pat.every((p, j) => equal(p, v[i + j]!))) idx.push(i)
          } else if (v === null) return null
          else throw new JqError(`Cannot determine indices of ${typeOf(b)} in ${typeOf(v)}`)
          if (a.name === 'indices') return idx
          if (!idx.length) return null
          idx = a.name === 'index' ? idx.slice(0, 1) : idx.slice(-1)
          return idx[0]!
        })
      case 'isnan/0':
        return [Number.isNaN(num(v))]
      case 'isinfinite/0':
        return [!Number.isFinite(num(v)) && !Number.isNaN(num(v))]
      case 'nan/0':
        return [NaN]
      case 'infinite/0':
        return [Infinity]
      case 'env/0':
        return [lookupVar(this.env0, 'ENV')]
      case 'input/0': {
        if (!this.inputs.length) throw new JqError('No more inputs')
        return [this.inputs.shift()!]
      }
      case 'inputs/0': {
        const all = this.inputs
        this.inputs = []
        return all
      }
      case 'IN/1':
        return [arg(0).some((x) => equal(x, v))]
      case 'IN/2':
        return [arg(0).some((x) => arg(1).some((y) => equal(x, y)))]
      case 'tostream/0':
        return allPaths(v)
          .slice(1)
          .filter((p) => {
            const x = getpath(v, p)
            return !(Array.isArray(x) && x.length) && !(isObj(x) && x.size)
          })
          .map((p) => [p, getpath(v, p)])
      case 'halt/0':
        throw new Halt(0)
      case 'halt_error/0':
      case 'halt_error/1':
        throw new Halt(n ? num(arg(0)[0]!) : 5, v)
      case 'builtins/0':
        return [['length/0', 'map/1', 'select/1']]
      case 'input_filename/0':
        return [null]
      case 'now/0':
        return [Date.now() / 1000]
      case 'debug/0':
        return [v]
    }
    throw new JqCompileError(`${key} is not defined at <top-level>, line 1:`)
  }

  withClosure(env: Env, name: string, ast: Ast): Env {
    const e = child(env)
    e.closures.set(name, { ast, env })
    return e
  }
}

class BreakOut extends JqError {}
class Halt extends Error {
  code: number
  value: J | undefined
  constructor(code: number, value?: J) {
    super('halt')
    this.code = code
    this.value = value
  }
}

function contains(a: J, b: J): boolean {
  if (typeof a === 'string' && typeof b === 'string') return a.includes(b)
  if (Array.isArray(a) && Array.isArray(b)) return b.every((y) => a.some((x) => contains(x, y)))
  if (isObj(a) && isObj(b)) return [...b].every(([k, y]) => a.has(k) && contains(a.get(k)!, y))
  if (typeOf(a) !== typeOf(b)) throw new JqError(`${desc(a)} and ${desc(b)} cannot have their containment checked`)
  return equal(a, b)
}

/* ── The command ─────────────────────────────────────────────────────────── */

export function runJq(args: string[], io: ToolIO): ToolResult {
  let raw = false
  let join = false
  let compact = false
  let nullInput = false
  let slurp = false
  let exitStatus = false
  let sortKeys = false
  let rawInput = false
  let indent = 2
  let filter: string | null = null
  const files: string[] = []
  const vars = new Map<string, J>()
  const named = new Map<string, J>()
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!
    if (a === '--arg' || a === '--argjson' || a === '--slurpfile' || a === '--rawfile') {
      const name = args[++i]
      const val = args[++i]
      if (name === undefined || val === undefined) return { out: '', err: `jq: ${a} takes two parameters (e.g. ${a} varname value)\n`, code: 2 }
      if (a === '--arg') vars.set(name, val)
      else if (a === '--argjson') {
        const r = parseJsonStream(val)
        if (r.error || r.values.length !== 1) return { out: '', err: `jq: Invalid JSON text passed to --argjson\n`, code: 2 }
        vars.set(name, r.values[0]!)
      } else {
        const t = io.readFile(val)
        if (typeof t !== 'string') return { out: '', err: `jq: error: Could not open ${val}: ${t.error}\n`, code: 2 }
        vars.set(name, a === '--rawfile' ? t : parseJsonStream(t).values)
      }
      named.set(name, vars.get(name)!)
      continue
    }
    if (a === '--tab') {
      indent = -1
      continue
    }
    if (a === '--indent') {
      indent = Number(args[++i] ?? 2)
      continue
    }
    if (a === '--raw-output') raw = true
    else if (a === '--join-output') raw = join = true
    else if (a === '--compact-output') compact = true
    else if (a === '--null-input') nullInput = true
    else if (a === '--slurp') slurp = true
    else if (a === '--exit-status') exitStatus = true
    else if (a === '--sort-keys') sortKeys = true
    else if (a === '--raw-input') rawInput = true
    else if (a === '--version') return { out: 'jq-1.7 (practice terminal)\n', err: '', code: 0 }
    else if (/^-[a-zA-Z]+$/.test(a)) {
      for (const c of a.slice(1)) {
        if (c === 'r') raw = true
        else if (c === 'j') raw = join = true
        else if (c === 'c') compact = true
        else if (c === 'n') nullInput = true
        else if (c === 's') slurp = true
        else if (c === 'e') exitStatus = true
        else if (c === 'S') sortKeys = true
        else if (c === 'R') rawInput = true
        else if (c === 'M' || c === 'C' || c === 'a') continue
        else return { out: '', err: `jq: Unknown arguments: ${a}\nUse jq --help for help with command-line options,\nor see the jq manpage, or online docs  at https://jqlang.github.io/jq\n`, code: 2 }
      }
    } else if (filter === null) filter = a
    else files.push(a)
  }
  if (filter === null) return { out: '', err: 'Usage:\tjq [OPTIONS] FILTER [FILES...]\n', code: 2 }
  let ast: Ast
  try {
    ast = parseJq(filter)
  } catch (e) {
    const msg = e instanceof JqCompileError ? e.message : String(e)
    return { out: '', err: `jq: error: ${msg}\njq: 1 compile error\n`, code: 3 }
  }
  // Input: the files one after another, or standard input.
  const sources: { name: string; text: string }[] = []
  let err = ''
  if (!nullInput || files.length) {
    if (files.length) {
      for (const f of files) {
        const t = io.readFile(f)
        if (typeof t !== 'string') {
          err += `jq: error: Could not open ${f}: ${t.error}\n`
          continue
        }
        sources.push({ name: f, text: t })
      }
      if (!sources.length) return { out: '', err, code: 2 }
    } else if (!nullInput) {
      if (io.stdin === null) return { out: '', err: 'jq: give it a file name, or pipe JSON into it (… | jq .)\n', code: 2 }
      sources.push({ name: '<stdin>', text: io.takeStdin() })
    }
  }
  let parseError: string | undefined
  let inputs: { v: J; where: string }[] = []
  for (const src of sources) {
    if (rawInput) {
      const lines = src.text.split('\n')
      if (lines[lines.length - 1] === '') lines.pop()
      if (slurp) inputs.push({ v: src.text, where: src.name })
      else inputs.push(...lines.map((l, i) => ({ v: l as J, where: `${src.name}:${i + 1}` })))
      continue
    }
    const r = parseJsonStream(src.text)
    inputs.push(...r.values.map((v, i) => ({ v, where: `${src.name}:${r.lines[i]}` })))
    if (r.error) {
      parseError = r.error
      break
    }
  }
  if (slurp && !rawInput) inputs = [{ v: inputs.map((x) => x.v), where: '<unknown>' }]
  if (slurp && rawInput) inputs = [{ v: inputs.map((x) => x.v as string).join(''), where: '<unknown>' }]
  vars.set('ENV', new Map(Object.entries(io.env)))
  vars.set('__prog_args', [])
  vars.set('named', new Map(named))
  vars.set('__named', new Map([['named', new Map(named)]]))
  const runs = nullInput ? [{ v: null as J, where: '<unknown>' }] : inputs
  const interp = new Interp(vars, nullInput ? inputs.map((x) => x.v) : [])
  let out = ''
  let code = 0
  let last: J | undefined
  const show = (v: J) => (raw && typeof v === 'string' ? v : dump(v, compact, indent, sortKeys)) + (join ? '' : '\n')
  for (const r of runs) {
    try {
      for (const v of interp.ev(ast, r.v, interp.env0)) {
        out += show(v)
        last = v
      }
    } catch (e) {
      if (e instanceof Halt) {
        if (e.value !== undefined) err += typeof e.value === 'string' ? e.value : `${dump(e.value, true)}\n`
        return { out, err, code: e.code }
      }
      if (e instanceof JqCompileError) return { out, err: `${err}jq: error: ${e.message}\njq: 1 compile error\n`, code: 3 }
      if (!(e instanceof JqError)) throw e
      const msg = typeof e.value === 'string' ? e.value : `${dump(e.value, true)} (not a string)`
      err += `jq: error (at ${r.where}): ${msg}\n`
      code = 5
    }
  }
  if (parseError) {
    err += `jq: parse error: ${parseError}\n`
    code = 5
  }
  if (exitStatus && code === 0) code = last === undefined ? 4 : truthy(last) ? 0 : 1
  return { out, err, code }
}
