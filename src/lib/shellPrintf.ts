/* ============================================================================
   C-style printf for the practice terminal
   ----------------------------------------------------------------------------
   The conversions bash's printf and awk's printf share: %d %i %u %o %x %X
   %f %F %e %E %g %G %c %s, with the flags - + space 0 #, a width and a
   precision. Pure functions, no shell state.
   ========================================================================== */

export interface Spec {
  flags: string
  width?: number
  prec?: number
  conv: string
}

const pad = (body: string, spec: Spec, numeric: boolean): string => {
  const w = spec.width ?? 0
  if (body.length >= w) return body
  if (spec.flags.includes('-')) return body.padEnd(w)
  if (numeric && spec.flags.includes('0')) {
    const m = /^([+\- ]|0[xX])?(.*)$/s.exec(body)!
    const sign = m[1] ?? ''
    return sign + m[2]!.padStart(w - sign.length, '0')
  }
  return body.padStart(w)
}

const signOf = (neg: boolean, spec: Spec) => (neg ? '-' : spec.flags.includes('+') ? '+' : spec.flags.includes(' ') ? ' ' : '')

/** %d and %i. */
export function fmtInt(n: number, spec: Spec): string {
  const v = Number.isFinite(n) ? Math.trunc(n) : 0
  let digits = Math.abs(v).toLocaleString('fullwide', { useGrouping: false })
  if (spec.prec !== undefined) digits = spec.prec === 0 && v === 0 ? '' : digits.padStart(spec.prec, '0')
  const body = signOf(v < 0, spec) + digits
  return pad(body, spec.prec !== undefined ? { ...spec, flags: spec.flags.replace('0', '') } : spec, true)
}

/** %u %o %x %X: negative numbers show as 64-bit two's complement, like C. */
export function fmtUnsigned(n: number, spec: Spec): string {
  const v = Number.isFinite(n) ? Math.trunc(n) : 0
  const big = v < 0 ? (BigInt(v) & ((1n << 64n) - 1n)) : BigInt(v)
  const base = spec.conv === 'o' ? 8 : spec.conv === 'u' ? 10 : 16
  let digits = big.toString(base)
  if (spec.conv === 'X') digits = digits.toUpperCase()
  if (spec.prec !== undefined) digits = spec.prec === 0 && big === 0n ? '' : digits.padStart(spec.prec, '0')
  if (spec.flags.includes('#') && big !== 0n) {
    if (spec.conv === 'o' && !digits.startsWith('0')) digits = `0${digits}`
    if (spec.conv === 'x') digits = `0x${digits}`
    if (spec.conv === 'X') digits = `0X${digits}`
  }
  return pad(digits, spec.prec !== undefined ? { ...spec, flags: spec.flags.replace('0', '') } : spec, true)
}

/** The exponent part as C writes it: at least two digits. */
const cExp = (s: string) => s.replace(/e([+-])(\d)$/, 'e$10$2')

/** %f %F %e %E %g %G. */
export function fmtFloat(x: number, spec: Spec): string {
  const upper = spec.conv === spec.conv.toUpperCase()
  const conv = spec.conv.toLowerCase()
  const neg = x < 0 || Object.is(x, -0)
  const a = Math.abs(x)
  let body: string
  if (!Number.isFinite(a)) {
    body = Number.isNaN(a) ? 'nan' : 'inf'
    const out = signOf(neg && !Number.isNaN(a), spec) + (upper ? body.toUpperCase() : body)
    return pad(out, { ...spec, flags: spec.flags.replace('0', '') }, false)
  }
  const p = spec.prec ?? 6
  if (conv === 'f') body = a.toFixed(Math.min(p, 100))
  else if (conv === 'e') body = cExp(a.toExponential(Math.min(p, 100)))
  else {
    const P = p === 0 ? 1 : p
    const X = a === 0 ? 0 : Number(a.toExponential(Math.min(P - 1, 100)).split('e')[1])
    body = P > X && X >= -4 ? a.toFixed(Math.min(P - 1 - X, 100)) : cExp(a.toExponential(Math.min(P - 1, 100)))
    if (!spec.flags.includes('#')) body = body.replace(/(\.\d*?)0+(e|$)/, '$1$2').replace(/\.(e|$)/, '$1')
  }
  if (spec.flags.includes('#') && !body.includes('.')) body = body.replace(/^(\d+)/, '$1.')
  if (upper) body = body.toUpperCase()
  return pad(signOf(neg, spec) + body, spec, true)
}

/** %s (and %c, which is the first character). */
export function fmtStr(s: string, spec: Spec): string {
  let v = spec.conv === 'c' ? [...s][0] ?? '' : s
  if (spec.prec !== undefined && spec.conv !== 'c') v = [...v].slice(0, spec.prec).join('')
  return pad(v, { ...spec, flags: spec.flags.replace('0', '') }, false)
}

/** Backslash escapes: the ones printf's format understands, or %b's (which also knows \c and \0NNN). */
export function unescapeC(t: string, forB = false): { text: string; stop: boolean } {
  let out = ''
  for (let i = 0; i < t.length; i++) {
    const c = t[i]!
    if (c !== '\\' || i + 1 >= t.length) {
      out += c
      continue
    }
    const n = t[++i]!
    const simple: Record<string, string> = { a: '\x07', b: '\b', e: '\x1b', E: '\x1b', f: '\f', n: '\n', r: '\r', t: '\t', v: '\v', '\\': '\\', '"': '"', "'": "'", '?': '?' }
    if (n in simple && !(forB && (n === '"' || n === '?'))) {
      out += simple[n]
      continue
    }
    if (forB && n === 'c') return { text: out, stop: true }
    if (n === 'x') {
      const m = /^[0-9a-fA-F]{1,2}/.exec(t.slice(i + 1))
      if (!m) {
        out += '\\x'
        continue
      }
      out += String.fromCharCode(parseInt(m[0], 16))
      i += m[0].length
      continue
    }
    if (n === 'u' || n === 'U') {
      const m = new RegExp(`^[0-9a-fA-F]{1,${n === 'u' ? 4 : 8}}`).exec(t.slice(i + 1))
      if (!m) {
        out += `\\${n}`
        continue
      }
      out += String.fromCodePoint(parseInt(m[0], 16))
      i += m[0].length
      continue
    }
    if (/[0-7]/.test(n)) {
      // printf's format: \NNN (1-3 digits). %b: \0NNN (0 then up to 3), or \NNN.
      const rest = t.slice(i)
      const m = forB && n === '0' ? /^0[0-7]{0,3}/.exec(rest)! : /^[0-7]{1,3}/.exec(rest)!
      const digits = forB && n === '0' ? m[0].slice(1) || '0' : m[0]
      out += String.fromCharCode(parseInt(digits, 8) & 255)
      i += m[0].length - 1
      continue
    }
    out += `\\${n}`
  }
  return { text: out, stop: false }
}

/** How bash's printf %q quotes a word so the shell reads it back unchanged. */
export function shellQuote(s: string): string {
  if (s === '') return "''"
  // Control characters and anything outside ASCII: bash switches to $'…'.
  if (/[\x00-\x1f\x7f-￿]/.test(s)) {
    let out = ''
    for (const ch of s) {
      const named: Record<string, string> = { '\x07': '\\a', '\b': '\\b', '\x1b': '\\E', '\f': '\\f', '\n': '\\n', '\r': '\\r', '\t': '\\t', '\v': '\\v', '\\': '\\\\', "'": "\\'" }
      if (named[ch]) out += named[ch]
      else if (/[\x20-\x7e]/.test(ch)) out += ch
      else for (const b of new TextEncoder().encode(ch)) out += `\\${b.toString(8).padStart(3, '0')}`
    }
    return `$'${out}'`
  }
  let out = ''
  for (let i = 0; i < s.length; i++) {
    const c = s[i]!
    if (` !"$&'()*,;<>?[\\]^\`{|}`.includes(c) || (i === 0 && (c === '~' || c === '#'))) out += `\\${c}`
    else out += c
  }
  return out
}

/** A number the way C's strtol would read it for printf: 'A gives 65, 0x1f and 010 work. */
export function parseCNumber(a: string, float: boolean): { n: number; ok: boolean } {
  if (a === '') return { n: 0, ok: true }
  if (a[0] === "'" || a[0] === '"') return { n: a.length > 1 ? a.codePointAt(1)! : 0, ok: true }
  const t = a.trim()
  if (float) {
    const m = /^[+-]?(?:inf(?:inity)?|nan|0[xX][0-9a-fA-F]+|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)/i.exec(t)
    if (!m) return { n: 0, ok: false }
    const txt = m[0].toLowerCase()
    const n = /inf/.test(txt) ? (txt.startsWith('-') ? -Infinity : Infinity) : /nan/.test(txt) ? NaN : /0x/.test(txt) ? parseInt(txt, 16) : Number(txt)
    return { n, ok: m[0].length === t.length }
  }
  const m = /^([+-]?)(0[xX][0-9a-fA-F]+|0[0-7]*|[1-9]\d*)/.exec(t)
  if (!m) return { n: 0, ok: false }
  const body = m[2]!
  const v = /^0[xX]/.test(body) ? parseInt(body, 16) : body.startsWith('0') ? parseInt(body, 8) || 0 : Number(body)
  return { n: m[1] === '-' ? -v : v, ok: m[0].length === t.length }
}

/** Splits a format into literal text and conversions; `*` widths are kept as -1 for the caller to fill. */
export function parseFormat(fmt: string): (string | (Spec & { starW?: boolean; starP?: boolean }))[] {
  const out: (string | (Spec & { starW?: boolean; starP?: boolean }))[] = []
  const re = /%([-+ 0#']*)(\*|\d+)?(?:\.(\*|\d*))?([diouxXfFeEgGcsbq%])/g
  let last = 0
  for (let m = re.exec(fmt); m; m = re.exec(fmt)) {
    if (m.index > last) out.push(fmt.slice(last, m.index))
    last = m.index + m[0].length
    if (m[4] === '%') {
      out.push('%')
      continue
    }
    const spec: Spec & { starW?: boolean; starP?: boolean } = { flags: m[1]!.replace("'", ''), conv: m[4]! }
    if (m[2] === '*') spec.starW = true
    else if (m[2] !== undefined) spec.width = Number(m[2])
    if (m[3] === '*') spec.starP = true
    else if (m[3] !== undefined) spec.prec = Number(m[3] || 0)
    out.push(spec)
  }
  if (last < fmt.length) out.push(fmt.slice(last))
  return out
}
